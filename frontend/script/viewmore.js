// viewmore.js

const bearerToken = "eyJ4NXQiOiJOV1psTVRZd09HVmhNMk5tT1RBek4ySTJOMkk0TkdVeU1UQXlOamszTkdKak9UVXhPVGd3T1EiLCJraWQiOiJOVEF3TmpWaU56azBOVGc1WlRZM056SmxOVFl4Tmpka1lXWTFPRGxtTkRSaVpqYzRNR1kyTTJSbVlqVm1ZVEExTjJReU56azJOMlU1TUdVeU5HVTBOUV9SUzI1NiIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiJhY2MiLCJhdXQiOiJBUFBMSUNBVElPTiIsImF1ZCI6IkFnQWp3OG9CNm1QSlFZc0pTc3p1SmFFM2toNGEiLCJuYmYiOjE3NDcyODg1NjMsImF6cCI6IkFnQWp3OG9CNm1QSlFZc0pTc3p1SmFFM2toNGEiLCJzY29wZSI6ImFjY2Vzc190b2tlbiIsImlzcyI6Imh0dHBzOlwvXC9zc28uZGl0Lmdvdi5idFwvb2F1dGgyXC90b2tlbiIsImV4cCI6MTc0NzI5MjE2MywiaWF0IjoxNzQ3Mjg4NTYzLCJqdGkiOiJiZjNiZTA2NS1jMGE3LTQ5NDAtOGNhNC01MTU0YzM4NTZjNDgifQ.eAS9hO9JWd2Fj8819MnOx2ViAtj7uokzDio8WS8V59jbAKtnAT5onvEZpqpBc2FFCgIq6tq_eFNrB0Noualvw98JD4bQuUuOkRjq78LeCusY77M-wmKFI9pCI8O4aEKlXiOGoXKrt-5DQwrt8XOlkzFHDisg5OoU-uv4MmO7b2U47X29mhMuta4_dNU5Wpam9-XvMzAOXoN9Xn6TQntHatecq6z6Fsz_rnCUAc9b-5CxTzz6cBk9y8eZP0HboB_Hcdh9WXqkZt6PeXOQgJPg3MVcawF1dRDT881YYgOi-PsK6KQTRQRX6SXCittEtCJhrei1_35MvxFtQtUl_2Q0Ag"; // Replace with your real token
const CITIZEN_API = "https://datahub-apim.tech.gov.bt/dcrc_citizen_details_api/1.0.0/citizendetails/";
const FAMILY_API = "https://datahub-apim.tech.gov.bt/dcrc_family_details_api/1.0.0/familyDetailsByHouseHoldNo/";
const IMAGE_API = "https://datahub-apim.tech.gov.bt/dcrc_restimagesapi/1.0.0/citizenImage/";

// Get CID from URL
const cid = new URLSearchParams(window.location.search).get("cid");
if (!cid) {
  alert("No CID provided");
} else {
  loadProfile(cid);
}

async function loadProfile(cid) {
  const citizen = await fetchCitizen(cid);
  if (!citizen) {
    alert("Citizen not found.");
    return;
  }

  setPersonalInfo(citizen);
  setImage(cid);

  // Father
  if (citizen.fatherCIDNo) {
    const father = await fetchCitizen(citizen.fatherCIDNo);
    if (father) setFamilySection("Father", father);
  }

  // Mother
  if (citizen.motherCIDNo) {
    const mother = await fetchCitizen(citizen.motherCIDNo);
    if (mother) setFamilySection("Mother", mother);
  }

  // Spouse (scan household children to detect)
  if (citizen.householdNo) {
    const family = await fetchHousehold(citizen.householdNo);

    let spouseCID = null;
    for (const member of family) {
      if ((member.fatherCID === cid || member.motherCID === cid)) {
        const otherCID = (member.fatherCID === cid) ? member.motherCID : member.fatherCID;
        if (otherCID && otherCID !== cid) {
          spouseCID = otherCID;
          break;
        }
      }
    }

    if (spouseCID) {
      const spouse = await fetchCitizen(spouseCID);
      if (spouse) setFamilySection("Spouse", spouse);
    }
  }
}

// -------------------------
// Section Fill Functions
// -------------------------
function setPersonalInfo(data) {
  document.querySelector(".profile-pic").src = "https://randomuser.me/api/portraits/men/31.jpg";
  setInputValue('input[value="citizen name"]', `${data.firstName || ''} ${data.lastName || ''}`.trim());
  setInputValue('input[value="citizenship id"]', data.cid);
  setInputValue('input[value="gender"]', data.gender);
  setInputValue('input[value="Date"]', data.dob);
  setInputValue('input[value="religion"]', data.religion);
  setInputValue('input[value="occupation"]', data.occupation);
  setInputValue('input[value="education"]', data.qualification);
  setInputValue('input[value="citizen type"]', "Not Available");

  setInputValue('input[value="household no"]', data.householdNo);
  setInputValue('input[value="house no"]', data.houseNo);
  setInputValue('input[value="thram no"]', data.thramNo);
  setInputValue('input[value="dzongkhag"]', data.dzongkhagName);
  setInputValue('input[value="gewog"]', data.gewogName);
  setInputValue('input[value="village"]', data.villageName);
}

function setFamilySection(role, person) {
  const section = [...document.querySelectorAll(".card")].find(card =>
    card.querySelector("h3")?.textContent.toLowerCase().includes(role.toLowerCase())
  );
  if (!section) return;
  const inputs = section.querySelectorAll("input");

  inputs[0].value = `${person.firstName || ''} ${person.lastName || ''}`.trim() || "Not Available";
  inputs[1].value = person.cid || "Not Available";
  inputs[2].value = person.householdNo || "Not Available";
  inputs[3].value = person.houseNo || "Not Available";
  inputs[4].value = person.thramNo || "Not Available";
  inputs[5].value = person.dzongkhagName || "Not Available";
  inputs[6].value = person.gewogName || "Not Available";
  inputs[7].value = person.villageName || "Not Available";
}

function setInputValue(selector, value) {
  const input = document.querySelector(selector);
  if (input) input.value = value || "Not Available";
}

// -------------------------
// API Fetch Functions
// -------------------------
async function fetchCitizen(cid) {
  try {
    const res = await fetch(CITIZEN_API + cid, {
      headers: { Authorization: "Bearer " + bearerToken }
    });
    const json = await res.json();
    return json.citizenDetailsResponse?.citizenDetail?.[0] || null;
  } catch {
    return null;
  }
}

async function fetchHousehold(householdNo) {
  try {
    const res = await fetch(FAMILY_API + householdNo, {
      headers: { Authorization: "Bearer " + bearerToken }
    });
    const json = await res.json();
    return json.familyDetails?.familyDetail || [];
  } catch {
    return [];
  }
}

async function setImage(cid) {
  try {
    const res = await fetch(IMAGE_API + cid, {
      headers: { Authorization: "Bearer " + bearerToken }
    });
    const json = await res.json();
    const b64 = json.citizenimages?.citizenimage?.[0]?.image;
    if (b64) {
      document.querySelector(".profile-pic").src = `data:image/jpeg;base64,${b64}`;
    }
  } catch {
    // Keep default image
  }
}
