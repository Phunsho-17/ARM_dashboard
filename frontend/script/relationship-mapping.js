// CONFIGURATION
const bearerToken = "eyJ4NXQiOiJOV1psTVRZd09HVmhNMk5tT1RBek4ySTJOMkk0TkdVeU1UQXlOamszTkdKak9UVXhPVGd3T1EiLCJraWQiOiJOVEF3TmpWaU56azBOVGc1WlRZM056SmxOVFl4Tmpka1lXWTFPRGxtTkRSaVpqYzRNR1kyTTJSbVlqVm1ZVEExTjJReU56azJOMlU1TUdVeU5HVTBOUV9SUzI1NiIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiJhY2MiLCJhdXQiOiJBUFBMSUNBVElPTiIsImF1ZCI6IkFnQWp3OG9CNm1QSlFZc0pTc3p1SmFFM2toNGEiLCJuYmYiOjE3NDY5NzY2NzcsImF6cCI6IkFnQWp3OG9CNm1QSlFZc0pTc3p1SmFFM2toNGEiLCJzY29wZSI6ImFjY2Vzc190b2tlbiIsImlzcyI6Imh0dHBzOlwvXC9zc28uZGl0Lmdvdi5idFwvb2F1dGgyXC90b2tlbiIsImV4cCI6MTc0Njk4MDI3NywiaWF0IjoxNzQ2OTc2Njc3LCJqdGkiOiIwM2IwM2FiMC0wMjZlLTRmNjMtODU2YS00MWYyMzM5MGUwYmMifQ.Lw6dtYnPzODP-Gwe60z9gaJiUgqonREV4I4_FpqJaO7hG6to9gnf4KGf16x8-OVZiyt68TnPXTvL_UsWjUFZY61CqFEiPnIwMjacCqyG7s-eTeKmLF-Pb_CfdbK9_rQeLVU1unoGz2P-FjbaonD-hgaJCBsCTkcZ8K8hxUYC1LFKdg3SN1H3V7_-x0HZnwsFOfeS1uDn8uDNRe98aKhnyANB_SoDid-NpbYs0bTvGG0-Tsfibb2ssXo-_zVHcb6GFurr_FvCYsF_ghqQg0gEQdWciw1BJWOEiXnmCAEr4epd3y7TVnB9CeM3ka08aTrxCaFbrb8VahL_0S0DWkF_rw";

const CITIZEN_API = "https://datahub-apim.tech.gov.bt/dcrc_citizen_details_api/1.0.0/citizendetails/";
const FAMILY_API  = "https://datahub-apim.tech.gov.bt/dcrc_family_details_api/1.0.0/familyDetailsByHouseHoldNo/";
const IMAGE_API   = "https://datahub-apim.tech.gov.bt/dcrc_restimagesapi/1.0.0/citizenImage/";

// ENTRY POINT
document.getElementById('searchBtn').addEventListener('click', async () => {
  const cid       = document.getElementById('cidInput').value.trim();
  const degree    = document.getElementById('degreeSelect').value;
  const container = document.getElementById('familyTreeContainer');

  if (!cid || !degree) {
    return alert("Please enter a CID and select a degree.");
  }
  container.innerHTML = "Loading…";

  try {
    const target = await fetchCitizen(cid);
    if (!target) throw new Error("Citizen not found");

    const family = await fetchHousehold(target.householdNo);
    await buildTree(target, family, degree);
  } catch (err) {
    console.error(err);
    container.innerHTML = "Error loading data.";
  }
});

// FETCH HELPERS
async function fetchCitizen(cid) {
  const res  = await fetch(CITIZEN_API + cid, {
    headers: { 'Authorization': 'Bearer ' + bearerToken, 'Accept': 'application/json' }
  });
  const json = await res.json();
  return json.citizenDetailsResponse?.citizenDetail?.[0] || null;
}

async function fetchHousehold(hh) {
  const res  = await fetch(FAMILY_API + hh, {
    headers: { 'Authorization': 'Bearer ' + bearerToken, 'Accept': 'application/json' }
  });
  const json = await res.json();
  return json.familyDetails?.familyDetail || [];
}

async function fetchImage(cid) {
  try {
    const res  = await fetch(IMAGE_API + cid, {
      headers: { 'Authorization': 'Bearer ' + bearerToken }
    });
    const j   = await res.json();
    const b64 = j.citizenimages?.citizenimage?.[0]?.image;
    return b64 ? `data:image/jpeg;base64,${b64}` : "image/default-placeholder.jpg";
  } catch {
    return "image/default-placeholder.jpg";
  }
}

// NODE CREATION w/ “target” highlight
async function makeNode(person, label) {
  const box = document.createElement('div');
  box.className = 'tree-node';
  if (label === 'Target') {
    box.classList.add('target');
  }

  const img  = await fetchImage(person.cid);
  const name = person.fullName || `${person.firstName || ''} ${person.lastName || ''}`.trim() || "Unknown";

  box.innerHTML = `
    <img src="${img}" class="profile-img" alt="Photo"/>
    <strong>${name}<br>(${person.cid})</strong><br>
    <em>${label}</em>
  `;
  return box;
}

// BUILD TREE (1st & 2nd degree logic unchanged)
async function buildTree(target, family, degree) {
  const container = document.getElementById('familyTreeContainer');
  container.innerHTML = '';
  const wrapper = document.createElement('div');
  wrapper.className = 'tree-wrapper';

  // spouse detection
  let spouse = null, spouseFamily = [];
  {
    const sample = family.find(m => m.fatherCID===target.cid || m.motherCID===target.cid);
    if (sample) {
      const spCid = sample.fatherCID===target.cid ? sample.motherCID : sample.fatherCID;
      spouse = await fetchCitizen(spCid);
      if (spouse?.householdNo) spouseFamily = await fetchHousehold(spouse.householdNo);
    }
  }

  // 1st DEGREE
  if (degree==="1") {
    const top = document.createElement('div');
    top.className = 'tree-children top-row';
    top.appendChild(await makeNode(target,"Target"));
    if (spouse) top.appendChild(await makeNode(spouse,"Spouse"));
    wrapper.appendChild(top);

    const kids = document.createElement('div');
    kids.className = 'tree-children';
    const pool = [...family,...spouseFamily], seen=new Set();
    for (const p of pool) {
      if ((p.fatherCID===target.cid||p.motherCID===target.cid|| spouse&&(p.fatherCID===spouse.cid||p.motherCID===spouse.cid))
          &&!seen.has(p.cid)) {
        seen.add(p.cid);
        kids.appendChild(await makeNode(p,"Child"));
      }
    }
    if (kids.childElementCount) wrapper.appendChild(kids);
    container.appendChild(wrapper);
    return;
  }

  // 2nd DEGREE
  if (degree==="2") {
    const parRow = document.createElement('div');
    parRow.className = 'tree-children';
    for (const pc of [target.fatherCIDNo,target.motherCIDNo].filter(Boolean)) {
      const p=await fetchCitizen(pc); if(p) parRow.appendChild(await makeNode(p,"Parent"));
    }
    const spacer=document.createElement('div'); spacer.style.flex="1"; parRow.appendChild(spacer);
    if (spouse) {
      for (const pc of [spouse.fatherCIDNo,spouse.motherCIDNo].filter(Boolean)) {
        const p=await fetchCitizen(pc); if(p) parRow.appendChild(await makeNode(p,"Parent"));
      }
    }
    wrapper.appendChild(parRow);

    const mid = document.createElement('div');
    mid.className='tree-children top-row';
    await addSiblings(target,family,mid);
    mid.appendChild(await makeNode(target,"Target"));
    if(spouse) mid.appendChild(await makeNode(spouse,"Spouse"));
    if(spouse) await addSiblings(spouse,spouseFamily,mid);
    wrapper.appendChild(mid);

    const kids2 = document.createElement('div');
    kids2.className='tree-children';
    const pool2=[...family,...spouseFamily], seen2=new Set();
    for (const p of pool2) {
      if ((p.fatherCID===target.cid||p.motherCID===target.cid|| spouse&&(p.fatherCID===spouse.cid||p.motherCID===spouse.cid))
          &&!seen2.has(p.cid)) {
        seen2.add(p.cid);
        kids2.appendChild(await makeNode(p,"Child"));
      }
    }
    if(kids2.childElementCount) wrapper.appendChild(kids2);

    container.appendChild(wrapper);
    return;
  }

  // 3rd DEGREE placeholder
  if (degree==="3") {
    container.appendChild(wrapper);
    return;
  }
}

// SIBLING HELPER
async function addSiblings(person,fam,row) {
  const seen=new Set();
  for (const m of fam) {
    if (m.cid!==person.cid && (m.fatherCID===person.fatherCIDNo||m.motherCID===person.motherCIDNo)) {
      seen.add(m.cid);
      row.appendChild(await makeNode(m,"Sibling"));
    }
  }
  if(person.motherCIDNo){
    const mom=await fetchCitizen(person.motherCIDNo);
    if(mom?.householdNo) for(const m of await fetchHousehold(mom.householdNo)){
      if(m.cid!==person.cid&&m.motherCID===person.motherCIDNo&&!seen.has(m.cid)){
        seen.add(m.cid); row.appendChild(await makeNode(m,"Sibling"));
      }
    }
  }
  if(person.fatherCIDNo){
    const dad=await fetchCitizen(person.fatherCIDNo);
    if(dad?.householdNo) for(const f of await fetchHousehold(dad.householdNo)){
      if(f.cid!==person.cid&&f.fatherCID===person.fatherCIDNo&&!seen.has(f.cid)){
        seen.add(f.cid); row.appendChild(await makeNode(f,"Sibling"));
      }
    }
  }
}
