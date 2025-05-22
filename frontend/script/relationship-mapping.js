// — CONFIGURATION —
const bearerToken = "eyJ4NXQiOiJOV1psTVRZd09HVmhNMk5tT1RBek4ySTJOMkk0TkdVeU1UQXlOamszTkdKak9UVXhPVGd3T1EiLCJraWQiOiJOVEF3TmpWaU56azBOVGc1WlRZM056SmxOVFl4Tmpka1lXWTFPRGxtTkRSaVpqYzRNR1kyTTJSbVlqVm1ZVEExTjJReU56azJOMlU1TUdVeU5HVTBOUV9SUzI1NiIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiJhY2MiLCJhdXQiOiJBUFBMSUNBVElPTiIsImF1ZCI6IkFnQWp3OG9CNm1QSlFZc0pTc3p1SmFFM2toNGEiLCJuYmYiOjE3NDcyODg1NjMsImF6cCI6IkFnQWp3OG9CNm1QSlFZc0pTc3p1SmFFM2toNGEiLCJzY29wZSI6ImFjY2Vzc190b2tlbiIsImlzcyI6Imh0dHBzOlwvXC9zc28uZGl0Lmdvdi5idFwvb2F1dGgyXC90b2tlbiIsImV4cCI6MTc0NzI5MjE2MywiaWF0IjoxNzQ3Mjg4NTYzLCJqdGkiOiJiZjNiZTA2NS1jMGE3LTQ5NDAtOGNhNC01MTU0YzM4NTZjNDgifQ.eAS9hO9JWd2Fj8819MnOx2ViAtj7uokzDio8WS8V59jbAKtnAT5onvEZpqpBc2FFCgIq6tq_eFNrB0Noualvw98JD4bQuUuOkRjq78LeCusY77M-wmKFI9pCI8O4aEKlXiOGoXKrt-5DQwrt8XOlkzFHDisg5OoU-uv4MmO7b2U47X29mhMuta4_dNU5Wpam9-XvMzAOXoN9Xn6TQntHatecq6z6Fsz_rnCUAc9b-5CxTzz6cBk9y8eZP0HboB_Hcdh9WXqkZt6PeXOQgJPg3MVcawF1dRDT881YYgOi-PsK6KQTRQRX6SXCittEtCJhrei1_35MvxFtQtUl_2Q0Ag";
const CITIZEN_API  = "https://datahub-apim.tech.gov.bt/dcrc_citizen_details_api/1.0.0/citizendetails/";
const FAMILY_API   = "https://datahub-apim.tech.gov.bt/dcrc_family_details_api/1.0.0/familyDetailsByHouseHoldNo/";
const IMAGE_API    = "https://datahub-apim.tech.gov.bt/dcrc_restimagesapi/1.0.0/citizenImage/";

// — ENTRY POINT —
document.getElementById('searchBtn').addEventListener('click', async () => {
  const cid = document.getElementById('cidInput').value.trim();
  const degree = document.getElementById('degreeSelect').value;
  const container = document.getElementById('familyTreeContainer');

  // ✅ Check if CID is empty
  if (!cid) {
    return alert("CID cannot be blank.");
  }

  // ✅ Check if CID contains only numbers
  if (!/^\d+$/.test(cid)) {
    return alert("CID must contain digits only (no letters or symbols).");
  }

  // ✅ Check if CID length is exactly 11 digits
  if (cid.length < 11) {
    return alert("CID must be exactly 11 digits. Currently too short.");
  }
  if (cid.length > 11) {
    return alert("CID must be exactly 11 digits. Currently too long.");
  }

  // ✅ Check if degree is selected
  if (!degree) {
    return alert("Please select a degree.");
  }

  // ✅ All validations passed — proceed
  showLoadingSpinner();

  try {
    const target = await fetchCitizen(cid);
    if (!target) throw new Error("Citizen not found");
    const family = await fetchHousehold(target.householdNo);
    await buildTree(target, family, degree);
  } catch (err) {
    console.error(err);
    container.innerHTML = "<p style='text-align:center;'>Error loading data.</p>";
  }
});

function showLoadingSpinner() {
  const container = document.getElementById('familyTreeContainer');
  container.innerHTML = `
    <div class="spinner-wrapper">
      <div class="loading-spinner"></div>
    </div>
  `;
}

// — FETCH HELPERS —
async function fetchCitizen(cid) {
  const res = await fetch(CITIZEN_API + cid, {
    headers: { 'Authorization': 'Bearer ' + bearerToken }
  });
  const js  = await res.json();
  return js.citizenDetailsResponse?.citizenDetail?.[0] || null;
}
async function fetchHousehold(hh) {
  const res = await fetch(FAMILY_API + hh, {
    headers: { 'Authorization': 'Bearer ' + bearerToken }
  });
  const js  = await res.json();
  return js.familyDetails?.familyDetail || [];
}
async function fetchImage(cid) {
  try {
    const res = await fetch(IMAGE_API + cid, {
      headers: { 'Authorization': 'Bearer ' + bearerToken }
    });
    const js  = await res.json();
    const b64 = js.citizenimages?.citizenimage?.[0]?.image;
    return b64 ? `data:image/jpeg;base64,${b64}` : "image/default-placeholder.jpg";
  } catch {
    return "image/default-placeholder.jpg";
  }
}

// — NODE CREATION —
async function makeNode(person, label) {
  const box = document.createElement('div');
  box.className = 'tree-node ' + label.toLowerCase();
  if (label === 'Target') box.classList.add('target');

  const img  = await fetchImage(person.cid);
  const name = person.fullName ||
               `${person.firstName||''} ${person.lastName||''}`.trim() ||
               "Unknown";

  box.innerHTML = `
    <img src="${img}" class="profile-img" alt="Photo"/>
    <strong>${name}<br>(${person.cid})</strong>
    <em>${label}</em>
  `;
  box.addEventListener('click', async () => {
    // Pre-fetch father and mother
    const [father, mother] = await Promise.all([
      person.fatherCIDNo ? fetchCitizen(person.fatherCIDNo) : null,
      person.motherCIDNo ? fetchCitizen(person.motherCIDNo) : null
    ]);
    person._father = father;
    person._mother = mother;
    showDetailCard(person);
  }); // ✅ Add this
  return box;
}

function showDetailCard(person) {
  const panel = document.getElementById('detailPanel');
  if (!panel) return;

  // Set image
  fetchImage(person.cid).then(img => {
    document.getElementById('detailPhoto').src = img;
  });

  // Fill values
  document.getElementById('detailName').innerText = person.fullName || `${person.firstName || ''} ${person.lastName || ''}`;
  document.getElementById('detailCID').innerText = person.cid || 'N/A';
  document.getElementById('detailDOB').innerText = person.dob || 'N/A';
  document.getElementById('detailGender').innerText = person.gender || 'N/A';
  document.getElementById('detailFather').innerHTML = 'Fetching <span class="loading-spinner-inline"></span>';
  document.getElementById('detailMother').innerHTML = 'Fetching <span class="loading-spinner-inline"></span>';

  // Fetch and show parents
  const father = person._father;
  const mother = person._mother;
  
  document.getElementById('detailFather').innerHTML =
    father && father.fullName
      ? `<a href="viewmore.html?cid=${father.cid}">${father.fullName}</a>`
      : 'Not Available';
  
  document.getElementById('detailMother').innerHTML =
    mother && mother.fullName
      ? `<a href="viewmore.html?cid=${mother.cid}">${mother.fullName}</a>`
      : 'Not Available';
  

  // Link to viewmore.html with CID
  document.getElementById('viewMoreBtn').href = `viewmore.html?cid=${person.cid}`;

  panel.style.display = 'block';
}
function closeDetailCard() {
  const panel = document.getElementById('detailPanel');
  if (panel) panel.style.display = 'none';
}


// — SIBLING HELPER —
async function addSiblings(person, fam, row) {
  const seen = new Set();
  for (const m of fam) {
    if (m.cid !== person.cid &&
       (m.fatherCID === person.fatherCIDNo || m.motherCID === person.motherCIDNo)) {
      seen.add(m.cid);
      row.append(await makeNode(m, "Sibling"));
    }
  }
  // bi‐directional mother
  if (person.motherCIDNo) {
    const mom = await fetchCitizen(person.motherCIDNo);
    if (mom?.householdNo) {
      for (const m of await fetchHousehold(mom.householdNo)) {
        if (m.cid !== person.cid && m.motherCID === person.motherCIDNo && !seen.has(m.cid)) {
          seen.add(m.cid);
          row.append(await makeNode(m, "Sibling"));
        }
      }
    }
  }
  // bi‐directional father
  if (person.fatherCIDNo) {
    const dad = await fetchCitizen(person.fatherCIDNo);
    if (dad?.householdNo) {
      for (const f of await fetchHousehold(dad.householdNo)) {
        if (f.cid !== person.cid && f.fatherCID === person.fatherCIDNo && !seen.has(f.cid)) {
          seen.add(f.cid);
          row.append(await makeNode(f, "Sibling"));
        }
      }
    }
  }
}

// — BUILD TREE (1st & 2nd deg) —
async function buildTree(target, family, degree) {
  const container = document.getElementById('familyTreeContainer');
  container.innerHTML = '';
  container.style.transform = 'scale(1)';
  window.scale = 1;

  const wrapper = document.createElement('div');
  container.append(wrapper);

  // find spouse
  let spouse = null, spouseFam = [];
  {
    const sample = family.find(m => m.fatherCID === target.cid || m.motherCID === target.cid);
    if (sample) {
      const spCid = sample.fatherCID === target.cid ? sample.motherCID : sample.fatherCID;
      if (spCid && spCid !== target.cid) {
        spouse = await fetchCitizen(spCid);
        if (spouse?.householdNo) {
          spouseFam = await fetchHousehold(spouse.householdNo);
        }
      }
    }
  }

  // 1st DEGREE
  if (degree === "1") {
    // top row: target + spouse
    const top = document.createElement('div');
    top.className = 'tree-children top-row';
    top.append(await makeNode(target, "Target"));
    if (spouse) top.append(await makeNode(spouse, "Spouse"));
    wrapper.append(top);

    // children row
    const kids = document.createElement('div');
    kids.className = 'tree-children';

    const pool = [...family, ...spouseFam];
    const seen = new Set();

for (const p of pool) {
  let relation = null;

  // Case 1: Child of both target and spouse
  if (
    (p.fatherCID === target.cid && p.motherCID === spouse?.cid) ||
    (p.motherCID === target.cid && p.fatherCID === spouse?.cid)
  ) {
    relation = "Child";
  }

  // Case 2: Child of target with someone else (not spouse)
  else if (
    (p.fatherCID === target.cid && (!spouse || p.motherCID !== spouse.cid)) ||
    (p.motherCID === target.cid && (!spouse || p.fatherCID !== spouse.cid))
  ) {
    relation = "Child (Target Only)";
  }

  // Case 3: Child of spouse with someone else (not target)
  else if (
    spouse && (
      (p.fatherCID === spouse.cid && p.motherCID !== target.cid) ||
      (p.motherCID === spouse.cid && p.fatherCID !== target.cid)
    )
  ) {
    relation = "Child (Spouse Only)";
  }

  if (relation && !seen.has(p.cid)) {
    seen.add(p.cid);
    const childNode = await makeNode(p, relation);
    kids.append(childNode);
  }
}

    if (kids.childElementCount) wrapper.append(kids);
    setTimeout(drawConnectors, 100);
    return;
  }

  // 2nd DEGREE
  if (degree === "2") {
    // top row: parents
    const parRow = document.createElement('div');
    parRow.className = 'tree-children top-row';
    for (const pc of [target.fatherCIDNo, target.motherCIDNo].filter(Boolean)) {
      const p = await fetchCitizen(pc);
      if (p) parRow.append(await makeNode(p, "Parent"));
    }
    wrapper.append(parRow);

    // middle row: siblings + target + spouse + spouse's siblings
    const yourRow = document.createElement('div');
    yourRow.className = 'tree-children';
    await addSiblings(target, family, yourRow);
    yourRow.append(await makeNode(target, "Target"));
    wrapper.append(yourRow);

    // Spouse + their siblings in separate row (if spouse exists)
    if (spouse) {
      const spouseRow = document.createElement('div');
      spouseRow.className = 'tree-children';
      spouseRow.append(await makeNode(spouse, "Spouse"));
      await addSiblings(spouse, spouseFam, spouseRow);
      wrapper.append(spouseRow);
    }

    // children row
    const kids2 = document.createElement('div');
    kids2.className = 'tree-children';
    const pool2 = [...family, ...spouseFam];
    const seen2 = new Set();

    for (const p of pool2) {
      const isChild =
        (p.fatherCID === target.cid && (!spouse || p.motherCID === spouse.cid)) ||
        (p.motherCID === target.cid && (!spouse || p.fatherCID === spouse.cid));
      if (isChild && !seen2.has(p.cid)) {
        seen2.add(p.cid);
        kids2.append(await makeNode(p, "Child"));
      }
    }

    if (kids2.childElementCount) wrapper.append(kids2);
    setTimeout(drawConnectors, 100);
    return;
  }

  // 3rd DEGREE placeholder
  if (degree === "3") {
    const note = document.createElement('p');
    note.textContent = "3rd degree tree not yet supported.";
    wrapper.append(note);
    setTimeout(drawConnectors, 100);
    return;
  }
}
function drawConnectors() {
  const tree = document.getElementById("familyTreeContainer");
  const existingSVG = document.getElementById("connectorSVG");
  if (existingSVG) existingSVG.remove(); // Clean old lines

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.id = "connectorSVG";
  svg.classList.add("connector-layer");
  svg.setAttribute("width", tree.scrollWidth);
  svg.setAttribute("height", tree.scrollHeight);
  tree.appendChild(svg);

  const nodes = tree.querySelectorAll(".tree-node");
  const pairs = [];

  // find center positions of nodes
  const positions = {};
  nodes.forEach((el, i) => {
    const rect = el.getBoundingClientRect();
    const treeRect = tree.getBoundingClientRect();
    const x = rect.left + rect.width / 2 - treeRect.left;
    const y = rect.top + rect.height / 2 - treeRect.top;
    positions[el.querySelector("strong")?.innerText || `node${i}`] = { el, x, y };
  });

  // Connect nodes that share the same parent container (e.g. .tree-children div)
  const rows = tree.querySelectorAll(".tree-children");
  rows.forEach(row => {
    const children = row.querySelectorAll(".tree-node");
    for (let i = 0; i < children.length - 1; i++) {
      const a = children[i];
      const b = children[i + 1];
      const posA = a.getBoundingClientRect();
      const posB = b.getBoundingClientRect();
      const treeRect = tree.getBoundingClientRect();

      const x1 = posA.left + posA.width / 2 - treeRect.left;
      const y1 = posA.top + posA.height - treeRect.top;
      const x2 = posB.left + posB.width / 2 - treeRect.left;
      const y2 = posB.top + posB.height - treeRect.top;

      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", x1);
      line.setAttribute("y1", y1);
      line.setAttribute("x2", x2);
      line.setAttribute("y2", y2);
      line.setAttribute("stroke", "#aaa");
      line.setAttribute("stroke-width", "2");
      svg.appendChild(line);
    }
  });
}

// — ZOOM & EXPORT —
let scale = 1;
const tree = document.getElementById('familyTreeContainer');
document.getElementById('zoomIn').onclick  = () => {
  scale = Math.min(scale + 0.1, 2);
  tree.style.transform = `scale(${scale})`;
};
document.getElementById('zoomOut').onclick = () => {
  scale = Math.max(scale - 0.1, 0.5);
  tree.style.transform = `scale(${scale})`;
};
document.getElementById('saveImage').onclick = () => {
  html2canvas(tree, { scale: 2 }).then(canvas => {
    const a = document.createElement('a');
    a.download = 'family-tree.png';
    a.href     = canvas.toDataURL();
    a.click();
  });
};
