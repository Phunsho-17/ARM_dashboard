const DEFAULT_AVATAR =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjUwIiBjeT0iMzciIHI9IjE1IiBmaWxsPSIjOUNBM0FGIi8+CjxwYXRoIGQ9Ik0yMCA3NUMyMCA2NS4wNTg5IDI4LjA1ODkgNTcgMzggNTdINjJDNzEuOTQxMSA1NyA4MCA2NS4wNTg5IDgwIDc1VjgwSDIwVjc1WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K"


let bearerToken = null;

async function fetchToken() {
  if (bearerToken) return bearerToken;

  try {
    const res = await fetch('http://localhost:5000/api/get-token');
    const data = await res.json();
    if (!data.token) throw new Error("No token received");
    bearerToken = data.token;
    return bearerToken;
  } catch (err) {
    console.error("Failed to fetch token", err);
    alert("Failed to fetch authorization token.");
    throw err;
  }
}

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
  await setImage(cid);

  if (citizen.fatherCIDNo) {
    const father = await fetchCitizen(citizen.fatherCIDNo);
    if (father) setFamilySection("Father", father);
  }

  if (citizen.motherCIDNo) {
    const mother = await fetchCitizen(citizen.motherCIDNo);
    if (mother) setFamilySection("Mother", mother);
  }

  if (citizen.householdNo) {
    const family = await fetchHousehold(citizen.householdNo);

    let spouseCID = null;
    for (const member of family) {
      if (member.fatherCID === cid || member.motherCID === cid) {
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

function setPersonalInfo(data) {
  // Set default first, will be replaced if image found
  document.querySelector(".profile-pic").src = DEFAULT_AVATAR;
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

async function fetchCitizen(cid) {
  try {
    const token = await fetchToken();
    const res = await fetch(CITIZEN_API + cid, {
      headers: { Authorization: "Bearer " + token }
    });
    const json = await res.json();
    return json.citizenDetailsResponse?.citizenDetail?.[0] || null;
  } catch {
    return null;
  }
}

async function fetchHousehold(householdNo) {
  try {
    const token = await fetchToken();
    const res = await fetch(FAMILY_API + householdNo, {
      headers: { Authorization: "Bearer " + token }
    });
    const json = await res.json();
    return json.familyDetails?.familyDetail || [];
  } catch {
    return [];
  }
}

async function setImage(cid) {
  try {
    const token = await fetchToken();
    const res = await fetch(IMAGE_API + cid, {
      headers: { Authorization: "Bearer " + token }
    });

    if (!res.ok) {
      // Handle API errors (e.g., 500 or 404)
      console.error(`Error fetching image for CID ${cid}. API returned status: ${res.status}. Using default avatar.`);
      document.querySelector(".profile-pic").src = DEFAULT_AVATAR;
      return;
    }

    const json = await res.json();
    const b64 = json.citizenimages?.citizenimage?.[0]?.image;
    if (b64) {
      document.querySelector(".profile-pic").src = `data:image/jpeg;base64,${b64}`;
    } else {
      document.querySelector(".profile-pic").src = DEFAULT_AVATAR;
    }
  } catch (error) {
    console.error(`Failed to fetch image for CID ${cid}. Error: ${error}. Using default avatar.`);
    document.querySelector(".profile-pic").src = DEFAULT_AVATAR; // Set default avatar on error
  }
}
