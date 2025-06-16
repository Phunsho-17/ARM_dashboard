const DEFAULT_AVATAR =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjUwIiBjeT0iMzciIHI9IjE1IiBmaWxsPSIjOUNBM0FGIi8+CjxwYXRoIGQ9Ik0yMCA3NUMyMCA2NS4wNTg5IDI4LjA1ODkgNTcgMzggNTdINjJDNzEuOTQxMSA1NyA4MCA2NS4wNTg5IDgwIDc1VjgwSDIwVjc1WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K"

// Toast notification system
function showToast(message, type = "info", duration = 4000) {
  // Create toast container if it doesn't exist
  let toastContainer = document.getElementById("toast-container")
  if (!toastContainer) {
    toastContainer = document.createElement("div")
    toastContainer.id = "toast-container"
    toastContainer.className = "toast-container"
    toastContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 400px;
    `
    document.body.appendChild(toastContainer)
  }

  const toast = document.createElement("div")
  toast.className = `toast toast-${type}`
  toast.style.cssText = `
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    overflow: hidden;
    transform: translateX(100%);
    transition: all 0.3s ease;
    opacity: 0;
    position: relative;
    border-left: 4px solid ${getToastColor(type)};
    color: ${getToastColor(type)};
  `

  const icon = getToastIcon(type)
  toast.innerHTML = `
    <div style="display: flex; align-items: center; padding: 16px; gap: 12px;">
      <div style="font-size: 20px; flex-shrink: 0;">${icon}</div>
      <div style="flex: 1; font-size: 14px; line-height: 1.4;">${message}</div>
      <button onclick="removeToast(this.parentElement.parentElement)" style="background: none; border: none; font-size: 18px; cursor: pointer; color: #666; padding: 0; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border-radius: 50%; transition: background-color 0.2s;">&times;</button>
    </div>
    <div style="height: 3px; background: rgba(0, 0, 0, 0.1); position: relative; overflow: hidden;">
      <div style="position: absolute; top: 0; left: 0; height: 100%; width: 100%; background: currentColor; animation: toast-progress ${duration}ms linear forwards; transform: translateX(-100%);"></div>
    </div>
  `

  toastContainer.appendChild(toast)

  // Trigger animation
  setTimeout(() => {
    toast.style.transform = "translateX(0)"
    toast.style.opacity = "1"
  }, 100)

  // Auto remove
  setTimeout(() => removeToast(toast), duration)

  return toast
}

function getToastIcon(type) {
  const icons = {
    success: "✅",
    error: "❌",
    warning: "⚠️",
    info: "ℹ️",
  }
  return icons[type] || icons.info
}

function getToastColor(type) {
  const colors = {
    success: "#10b981",
    error: "#ef4444",
    warning: "#f59e0b",
    info: "#3b82f6",
  }
  return colors[type] || colors.info
}

function removeToast(toast) {
  toast.style.transform = "translateX(100%)"
  toast.style.opacity = "0"
  setTimeout(() => {
    if (toast.parentElement) {
      toast.parentElement.removeChild(toast)
    }
  }, 300)
}

// Add CSS animation keyframes
if (!document.getElementById("toast-styles")) {
  const style = document.createElement("style")
  style.id = "toast-styles"
  style.textContent = `
    @keyframes toast-progress {
      from { transform: translateX(-100%); }
      to { transform: translateX(0); }
    }
    @media (max-width: 768px) {
      .toast-container {
        left: 20px !important;
        right: 20px !important;
        max-width: none !important;
      }
    }
  `
  document.head.appendChild(style)
}

let bearerToken = null

async function fetchToken() {
  if (bearerToken) return bearerToken

  try {
    const res = await fetch("http://localhost:5000/api/get-token")
    const data = await res.json()
    if (!data.token) throw new Error("No token received")
    bearerToken = data.token
    return bearerToken
  } catch (err) {
    console.error("Failed to fetch token", err)
    showToast("Failed to get authorization token. Please refresh the page and try again.", "error")
    throw err
  }
}
// Comprehensive family data gathering - fetches ALL related family data
async function gatherComprehensiveFamilyData(targetCID) {
  console.log(`🔍 Starting comprehensive family analysis for CID: ${targetCID}`)

  const target = await fetchCitizen(targetCID)
  if (!target) return null

  const allHouseholds = new Map()
  const allPeople = new Map()
  const processedHouseholds = new Set()

  // Add target to people map
  allPeople.set(target.cid, target)

  // Recursive function to fetch all related households
  async function fetchRelatedHouseholds(personCID, depth = 0) {
    if (depth > 3) return // Prevent infinite recursion

    const person = allPeople.get(personCID) || (await fetchCitizen(personCID))
    if (!person || !person.householdNo || processedHouseholds.has(person.householdNo)) return

    console.log(`📋 Fetching household ${person.householdNo} for ${person.fullName || person.firstName}`)

    const household = await fetchHousehold(person.householdNo)
    allHouseholds.set(person.householdNo, household)
    processedHouseholds.add(person.householdNo)

    // Add all household members to people map
    for (const member of household) {
      if (!allPeople.has(member.cid)) {
        allPeople.set(member.cid, member)
      }
    }

    // Recursively fetch households of spouses and parents
    for (const member of household) {
      // Find spouses through children
      const children = household.filter((child) => child.fatherCID === member.cid || child.motherCID === member.cid)

      for (const child of children) {
        const spouseCID = child.fatherCID === member.cid ? child.motherCID : child.fatherCID
        if (spouseCID && spouseCID !== member.cid && !allPeople.has(spouseCID)) {
          await fetchRelatedHouseholds(spouseCID, depth + 1)
        }
      }

      // Fetch parent households
      if (member.fatherCIDNo && !allPeople.has(member.fatherCIDNo)) {
        await fetchRelatedHouseholds(member.fatherCIDNo, depth + 1)
      }
      if (member.motherCIDNo && !allPeople.has(member.motherCIDNo)) {
        await fetchRelatedHouseholds(member.motherCIDNo, depth + 1)
      }
    }
  }

  // Start comprehensive data gathering
  await fetchRelatedHouseholds(targetCID)

  // Fetch additional households for target's parents and spouses
  if (target.fatherCIDNo) await fetchRelatedHouseholds(target.fatherCIDNo)
  if (target.motherCIDNo) await fetchRelatedHouseholds(target.motherCIDNo)

  console.log(`📊 Gathered ${allPeople.size} people from ${allHouseholds.size} households`)

  return await analyzeComprehensiveRelationships(target, allPeople, allHouseholds)
}

async function analyzeComprehensiveRelationships(target, allPeople, allHouseholds) {
  const relationships = {
    target,
    spouses: [],
    children: [],
    targetSiblings: [],
    spouseSiblings: [],
    parents: [],
    grandparents: [],
    siblingsExtended: [],
    allFamilyMembers: Array.from(allPeople.values()),
  }

  console.log(`🔬 Analyzing relationships for ${relationships.allFamilyMembers.length} family members`)

  // 1. Find ALL children
  relationships.children = relationships.allFamilyMembers.filter(
    (person) => person.fatherCID === target.cid || person.motherCID === target.cid,
  )

  // 2. Find ALL spouses
  const spouseCIDs = new Set()
  relationships.children.forEach((child) => {
    const otherParentCID = child.fatherCID === target.cid ? child.motherCID : child.fatherCID
    if (otherParentCID && otherParentCID !== target.cid) {
      spouseCIDs.add(otherParentCID)
    }
  })

  // CRITICAL: Fetch complete spouse data including parent information
  for (const spouseCID of spouseCIDs) {
    let spouse = allPeople.get(spouseCID)

    // If spouse data is incomplete or missing parent info, fetch complete details
    if (!spouse || !spouse.fatherCIDNo || !spouse.motherCIDNo) {
      console.log(`🔍 Fetching complete spouse data for CID: ${spouseCID}`)
      const completeSpouseData = await fetchCitizen(spouseCID)
      if (completeSpouseData) {
        // Update with complete data
        allPeople.set(spouseCID, completeSpouseData)
        spouse = completeSpouseData

        // Update in family members array too
        const existingIndex = relationships.allFamilyMembers.findIndex((p) => p.cid === spouseCID)
        if (existingIndex >= 0) {
          relationships.allFamilyMembers[existingIndex] = completeSpouseData
        } else {
          relationships.allFamilyMembers.push(completeSpouseData)
        }

        console.log(`✅ Updated spouse data: ${spouse.fullName || spouse.firstName}`)
        console.log(`   - Father: ${spouse.fatherCIDNo}, Mother: ${spouse.motherCIDNo}`)
      }
    }

    if (spouse) {
      relationships.spouses.push(spouse)
    }
  }

  // 3. UNIFIED SIBLING DETECTION FUNCTION
  async function findSiblingsForPerson(person, personType) {
    console.log(`🔍 === ${personType.toUpperCase()} SIBLING ANALYSIS ===`)
    console.log(`${personType}: ${person.fullName || person.firstName} (${person.cid})`)
    console.log(`${personType}'s father: ${person.fatherCIDNo}, ${personType}'s mother: ${person.motherCIDNo}`)

    // Ensure we have person's parents' households
    if (person.fatherCIDNo) {
      const father = await fetchCitizen(person.fatherCIDNo)
      if (father && father.householdNo && !allHouseholds.has(father.householdNo)) {
        console.log(`📋 Fetching ${personType}'s father's household: ${father.householdNo}`)
        const fatherHousehold = await fetchHousehold(father.householdNo)
        allHouseholds.set(father.householdNo, fatherHousehold)
        fatherHousehold.forEach((member) => {
          if (!allPeople.has(member.cid)) {
            allPeople.set(member.cid, member)
            relationships.allFamilyMembers.push(member)
            console.log(
              `➕ Added from ${personType} father's household: ${member.fullName || member.firstName} (${member.cid})`,
            )
          }
        })
      }
    }

    if (person.motherCIDNo) {
      const mother = await fetchCitizen(person.motherCIDNo)
      if (mother && mother.householdNo && !allHouseholds.has(mother.householdNo)) {
        console.log(`📋 Fetching ${personType}'s mother's household: ${mother.householdNo}`)
        const motherHousehold = await fetchHousehold(mother.householdNo)
        allHouseholds.set(mother.householdNo, motherHousehold)
        motherHousehold.forEach((member) => {
          if (!allPeople.has(member.cid)) {
            allPeople.set(member.cid, member)
            relationships.allFamilyMembers.push(member)
            console.log(
              `➕ Added from ${personType} mother's household: ${member.fullName || member.firstName} (${member.cid})`,
            )
          }
        })
      }
    }

    // Find siblings using identical logic
    console.log(
      `🔍 Searching for ${personType} siblings among ${relationships.allFamilyMembers.length} total family members`,
    )
    const siblings = relationships.allFamilyMembers.filter((candidate) => {
      const isNotSelf = candidate.cid !== person.cid
      const sharesFather =
        person.fatherCIDNo &&
        (candidate.fatherCID === person.fatherCIDNo || candidate.fatherCIDNo === person.fatherCIDNo)
      const sharesMother =
        person.motherCIDNo &&
        (candidate.motherCID === person.motherCIDNo || candidate.motherCIDNo === person.motherCIDNo)

      if (isNotSelf && (sharesFather || sharesMother)) {
        console.log(`✅ Found ${personType} sibling: ${candidate.fullName || candidate.firstName} (${candidate.cid})`)
        console.log(`   - Shares father: ${sharesFather}, Shares mother: ${sharesMother}`)
        return true
      }
      return false
    })

    console.log(`Found ${siblings.length} siblings for ${personType} ${person.fullName || person.firstName}`)
    console.log(`🔍 === END ${personType.toUpperCase()} SIBLING ANALYSIS ===`)

    return siblings
  }

  // 4. Find target siblings using unified function
  relationships.targetSiblings = await findSiblingsForPerson(target, "target")

  // 5. Find spouse siblings using IDENTICAL unified function
  for (const spouse of relationships.spouses) {
    const spouseSiblings = await findSiblingsForPerson(spouse, "spouse")

    // Add spouse siblings with spouse reference
    spouseSiblings.forEach((sibling) => {
      relationships.spouseSiblings.push({
        ...sibling,
        spouseOf: spouse.cid,
        spouseName: spouse.fullName || spouse.firstName,
      })
    })
  }

  // 6. Find parents
  if (target.fatherCIDNo) {
    const father = allPeople.get(target.fatherCIDNo)
    if (father) relationships.parents.push(father)
  }
  if (target.motherCIDNo) {
    const mother = allPeople.get(target.motherCIDNo)
    if (mother) relationships.parents.push(mother)
  }

  // 7. ENHANCED: Comprehensive sibling family analysis for degree 3
  const allSiblings = [...relationships.targetSiblings, ...relationships.spouseSiblings]

  for (const sibling of allSiblings) {
    const siblingFamily = {
      sibling,
      spouses: [],
      children: [],
    }

    console.log(`🔍 Analyzing family for sibling: ${sibling.fullName || sibling.firstName} (${sibling.cid})`)

    // Fetch sibling's household if not already fetched
    if (sibling.householdNo && !allHouseholds.has(sibling.householdNo)) {
      const siblingHousehold = await fetchHousehold(sibling.householdNo)
      allHouseholds.set(sibling.householdNo, siblingHousehold)
      siblingHousehold.forEach((person) => {
        if (!allPeople.has(person.cid)) {
          allPeople.set(person.cid, person)
          relationships.allFamilyMembers.push(person)
        }
      })
    }

    // Find ALL of sibling's children from updated family members
    siblingFamily.children = relationships.allFamilyMembers.filter(
      (person) => person.fatherCID === sibling.cid || person.motherCID === sibling.cid,
    )

    // Find ALL of sibling's spouses through children and household analysis
    const siblingSpouseCIDs = new Set()

    // Through children
    siblingFamily.children.forEach((child) => {
      const otherParentCID = child.fatherCID === sibling.cid ? child.motherCID : child.fatherCID
      if (otherParentCID && otherParentCID !== sibling.cid) {
        siblingSpouseCIDs.add(otherParentCID)
      }
    })

    // Fetch spouse households and their children
    for (const spouseCID of siblingSpouseCIDs) {
      let spouse = allPeople.get(spouseCID)
      if (!spouse) {
        spouse = await fetchCitizen(spouseCID)
        if (spouse) {
          allPeople.set(spouse.cid, spouse)
          relationships.allFamilyMembers.push(spouse)
        }
      }

      if (spouse) {
        siblingFamily.spouses.push(spouse)

        // Fetch spouse's household for additional children
        if (spouse.householdNo && !allHouseholds.has(spouse.householdNo)) {
          const spouseHousehold = await fetchHousehold(spouse.householdNo)
          allHouseholds.set(spouse.householdNo, spouseHousehold)
          spouseHousehold.forEach((person) => {
            if (!allPeople.has(person.cid)) {
              allPeople.set(person.cid, person)
              relationships.allFamilyMembers.push(person)

              // Check if this person is a child of the sibling or spouse
              if (
                person.fatherCID === sibling.cid ||
                person.motherCID === sibling.cid ||
                person.fatherCID === spouse.cid ||
                person.motherCID === spouse.cid
              ) {
                if (!siblingFamily.children.find((child) => child.cid === person.cid)) {
                  siblingFamily.children.push(person)
                }
              }
            }
          })
        }
      }
    }

    console.log(
      `Found ${siblingFamily.spouses.length} spouses and ${siblingFamily.children.length} children for sibling ${sibling.fullName || sibling.firstName}`,
    )

    if (siblingFamily.spouses.length > 0 || siblingFamily.children.length > 0) {
      relationships.siblingsExtended.push(siblingFamily)
    }
  }

  console.log(`✅ Enhanced analysis complete:`, {
    children: relationships.children.length,
    spouses: relationships.spouses.length,
    targetSiblings: relationships.targetSiblings.length,
    spouseSiblings: relationships.spouseSiblings.length,
    siblingsExtended: relationships.siblingsExtended.length,
    totalMembers: relationships.allFamilyMembers.length,
  })

  return relationships
}

// Add this validation function at the top of your file or in a separate validation file

// Valid Dzongkhag codes from Bhutan's administrative structure
const VALID_DZONGKHAG_CODES = [
  "01", "02", "03", "04", "05", "06", "07", "08", "09", "10",
  "11", "12", "13", "14", "15", "16", "17", "18", "19", "20"
];

// Dzongkhag names for better error messages
const DZONGKHAG_NAMES = {
  "01": "Bumthang", "02": "Chukha", "03": "Dagana", "04": "Gasa", "05": "Haa",
  "06": "Lhuentse", "07": "Mongar", "08": "Paro", "09": "Pemagatshel", "10": "Punakha",
  "11": "Samdrupjongkhar", "12": "Samtse", "13": "Sarpang", "14": "Thimphu", "15": "Trashigang",
  "16": "Trashiyangtse", "17": "Trongsa", "18": "Tsirang", "19": "Wangdue Phodrang", "20": "Zhemgang"
};

function validateCID(cid) {
  // Check if CID is provided
  if (!cid) {
    return {
      isValid: false,
      message: "CID number is required. Please enter a valid CID.",
      type: "warning"
    };
  }

  // Check if CID contains only digits
  if (!/^\d+$/.test(cid)) {
    return {
      isValid: false,
      message: "CID must contain only digits (0-9). Please remove any letters or symbols.",
      type: "error"
    };
  }

  // Check if CID is exactly 11 digits
  if (cid.length < 11) {
    return {
      isValid: false,
      message: `CID must be exactly 11 digits. You entered ${cid.length} digits (${11 - cid.length} more needed).`,
      type: "error"
    };
  }

  if (cid.length > 11) {
    return {
      isValid: false,
      message: `CID must be exactly 11 digits. You entered ${cid.length} digits (${cid.length - 11} too many).`,
      type: "error"
    };
  }

  // Extract dzongkhag code (first 2 digits)
  const dzongkhagCode = cid.substring(0, 2);

  // Check if dzongkhag code is valid
  if (!VALID_DZONGKHAG_CODES.includes(dzongkhagCode)) {
    return {
      isValid: false,
      message: `Invalid dzongkhag code "${dzongkhagCode}". Valid codes are: ${VALID_DZONGKHAG_CODES.join(", ")}.`,
      type: "error"
    };
  }

  // Check for obviously invalid patterns (like all same digits)
  if (/^(\d)\1{10}$/.test(cid)) {
    return {
      isValid: false,
      message: "CID cannot consist of the same digit repeated 11 times.",
      type: "error"
    };
  }

  // If all validations pass
  const dzongkhagName = DZONGKHAG_NAMES[dzongkhagCode];
  return {
    isValid: true,
    message: `Valid CID from ${dzongkhagName} (${dzongkhagCode}).`,
    type: "success"
  };
}

// Now replace your existing validation block with this:
document.getElementById("searchBtn").addEventListener("click", async () => {
  const cid = document.getElementById("cidInput").value.trim()
  const degree = document.getElementById("degreeSelect").value
  const container = document.getElementById("familyTreeContainer")
  const validationMessage = document.getElementById("validationMessage")

  validationMessage.textContent = ""

  // Enhanced CID validation
  const cidValidation = validateCID(cid);
  if (!cidValidation.isValid) {
    showToast(cidValidation.message, cidValidation.type);
    return;
  }

  // Degree validation
  if (!degree) {
    showToast("Please select a relationship degree (1, 2, or 3) to continue.", "warning")
    return
  }

  // Show success message for valid CID
  showToast(cidValidation.message, "success", 3000);

  validationMessage.textContent = ""
  showLoadingSpinner()
  showToast("Starting comprehensive family data analysis...", "info", 6000)

  try {
    const familyData = await gatherComprehensiveFamilyData(cid)
    if (!familyData) {
      showToast("Citizen not found in the database. Please verify the CID number.", "error")
      container.innerHTML = ""
      return
    }

    showToast("Building professional family tree...", "info", 4000)
    await buildProfessionalFamilyTree(familyData, degree)

    showToast(`Family tree successfully generated for degree ${degree}!`, "success")

    // Your existing audit logging code stays the same...
    fetch("/api/relationship/save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
      body: JSON.stringify({ cid, degree }),
    }).catch((err) => console.log("Audit save failed:", err))

    fetch("/api/audit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
      body: JSON.stringify({
        action: "Relationship Mapped",
        detail: `Viewed on CID ${cid} of Degree ${degree}`,
      }),
    }).catch((err) => console.log("Audit log failed:", err))
  } catch (err) {
    console.error(err)
    container.innerHTML =
      "<p style='text-align:center; color: #e53e3e; font-weight: 600;'>Error loading family data. Please try again.</p>"
    showToast("Failed to load family data. Please check your connection and try again.", "error")
  }
})

function showLoadingSpinner() {
  const container = document.getElementById("familyTreeContainer")
  container.innerHTML = `
    <div class="spinner-wrapper">
      <div class="loading-spinner"></div>
      <div class="loading-text">Gathering comprehensive family data...</div>
    </div>
  `
  showToast("Please wait while we analyze family relationships...", "info", 8000)
}

async function fetchCitizen(cid) {
  try {
    const token = await fetchToken()
    const res = await fetch(`https://datahub-apim.tech.gov.bt/dcrc_citizen_details_api/1.0.0/citizendetails/${cid}`, {
      headers: { Authorization: "Bearer " + token },
    })

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`)
    }

    const js = await res.json()
    const citizenData = js.citizenDetailsResponse?.citizenDetail?.[0] || null

    if (!citizenData) {
      console.log(`No citizen data found for CID: ${cid}`)
    }

    return citizenData
  } catch (error) {
    console.error("Failed to fetch citizen", error)
    showToast(`Failed to fetch data for CID ${cid}. Please try again.`, "error")
    return null
  }
}

async function fetchHousehold(hh) {
  try {
    const token = await fetchToken()
    const res = await fetch(
      `https://datahub-apim.tech.gov.bt/dcrc_family_details_api/1.0.0/familyDetailsByHouseHoldNo/${hh}`,
      {
        headers: { Authorization: "Bearer " + token },
      },
    )
    const js = await res.json()
    return js.familyDetails?.familyDetail || []
  } catch (error) {
    console.error("Failed to fetch household", error)
    return []
  }
}

async function fetchImage(cid) {
  try {
    const token = await fetchToken()
    const res = await fetch(`https://datahub-apim.tech.gov.bt/dcrc_restimagesapi/1.0.0/citizenImage/${cid}`, {
      headers: { Authorization: "Bearer " + token },
    })

    if (!res.ok) {
      console.log(`Image fetch failed for CID ${cid}: ${res.status}`)
      return DEFAULT_AVATAR
    }

    const js = await res.json()
    const b64 = js.citizenimages?.citizenimage?.[0]?.image

    if (!b64 || b64.trim() === "") {
      console.log(`No image data found for CID ${cid}`)
      return DEFAULT_AVATAR
    }

    try {
      const byteCharacters = atob(b64)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: "image/jpeg" })

      return new Promise((resolve) => {
        if (window.loadImage) {
          window.loadImage(
            blob,
            (canvas) => {
              if (canvas.type === "error" || !canvas.toDataURL) {
                console.log(`Image processing failed for CID ${cid}`)
                resolve(DEFAULT_AVATAR)
              } else {
                resolve(canvas.toDataURL("image/jpeg"))
              }
            },
            { orientation: true, canvas: true },
          )
        } else {
          // Fallback if loadImage is not available
          const url = URL.createObjectURL(blob)
          const img = new Image()
          img.onload = () => {
            URL.revokeObjectURL(url)
            resolve(url)
          }
          img.onerror = () => {
            URL.revokeObjectURL(url)
            console.log(`Image load failed for CID ${cid}`)
            resolve(DEFAULT_AVATAR)
          }
          img.src = url
        }
      })
    } catch (processingError) {
      console.log(`Image processing error for CID ${cid}:`, processingError)
      return DEFAULT_AVATAR
    }
  } catch (error) {
    console.log(`Image fetch error for CID ${cid}:`, error)
    return DEFAULT_AVATAR
  }
}

async function makeNode(person, label, level = "") {
  const box = document.createElement("div")

  // Enhanced class assignment for better styling
  const relationshipClass = label.toLowerCase().replace(/[^a-z]/g, "")
  box.className = `tree-node ${relationshipClass} ${level}`

  if (label.toLowerCase().includes("target")) box.classList.add("target")
  if (label.toLowerCase().includes("spouse")) box.classList.add("spouse")
  if (
    label.toLowerCase().includes("parent") ||
    label.toLowerCase().includes("father") ||
    label.toLowerCase().includes("mother")
  )
    box.classList.add("parent")
  if (label.toLowerCase().includes("child")) box.classList.add("child")
  if (label.toLowerCase().includes("sibling")) box.classList.add("sibling")
  if (
    label.toLowerCase().includes("grandparent") ||
    label.toLowerCase().includes("grandfather") ||
    label.toLowerCase().includes("grandmother")
  )
    box.classList.add("grandparent")

  box.setAttribute("data-cid", person.cid)
  box.setAttribute("data-father", person.fatherCIDNo || person.fatherCID || "")
  box.setAttribute("data-mother", person.motherCIDNo || person.motherCID || "")
  box.setAttribute("data-label", label)

  const img = await fetchImage(person.cid)
  const name = person.fullName || `${person.firstName || ""} ${person.lastName || ""}`.trim() || "Unknown"

  box.innerHTML = `
    <img src="${img}" class="profile-img" alt="Photo"/>
    <strong>${name}<br><small>(${person.cid})</small></strong>
    <em>${label}</em>
  `

  box.addEventListener("click", async () => {
    showDetailCard(person)
  })

  return box
}

// Enhanced modal functions with better animations
function showDetailCard(person) {
  const iframe = document.getElementById("detailIframe")
  const modal = document.getElementById("detailModal")

  // Set the iframe source
  iframe.src = `viewmore.html?cid=${person.cid}`

  // Show modal with animation
  modal.style.display = "flex"
  setTimeout(() => {
    modal.classList.add("show")
  }, 10)

  // Prevent body scroll when modal is open
  document.body.style.overflow = "hidden"
}

function closeDetailModal() {
  const modal = document.getElementById("detailModal")
  const iframe = document.getElementById("detailIframe")

  // Hide modal immediately without animation
  modal.classList.remove("show")
  modal.style.display = "none"
  iframe.src = ""

  // Restore body scroll
  document.body.style.overflow = "auto"
}

// Close modal when clicking outside
document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("detailModal")
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        closeDetailModal()
      }
    })
  }
})

// Close modal with Escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    const modal = document.getElementById("detailModal")
    if (modal && modal.style.display === "flex") {
      closeDetailModal()
    }
  }
})

const globalRenderedCIDs = new Set()

async function buildProfessionalFamilyTree(relationships, degree) {
  const container = document.getElementById("familyTreeContainer")
  container.innerHTML = ""
  container.style.transform = "scale(1)"
  window.scale = 1

  // Determine if this is a large family
  const totalMembers = relationships.allFamilyMembers.length
  if (totalMembers > 20) {
    container.classList.add("large-family")
  }

  globalRenderedCIDs.clear()

  const wrapper = document.createElement("div")
  wrapper.className = "tree-wrapper"
  container.append(wrapper)

  console.log(`🏗️ Building professional family tree for degree ${degree} with ${totalMembers} members`)

  // Build tree based on degree
  await buildDegreeOne(wrapper, relationships)

  if (degree === "1") {
    setTimeout(drawProfessionalConnectors, 200)
    return
  }

  if (degree === "2" || degree === "3") {
    await buildDegreeTwo(wrapper, relationships)
  }

  if (degree === "2") {
    setTimeout(drawProfessionalConnectors, 200)
    return
  }

  if (degree === "3") {
    await buildDegreeThree(wrapper, relationships)
  }

  setTimeout(drawProfessionalConnectors, 200)
}

async function buildDegreeOne(wrapper, relationships) {
  const { target, spouses, children } = relationships

  // Target and Spouse Level - side by side
  const targetLevel = document.createElement("div")
  targetLevel.className = "tree-level target-level"

  const targetNode = await makeNode(target, "Target", "target-level")
  targetLevel.append(targetNode)
  globalRenderedCIDs.add(target.cid)

  // Add spouses right next to target
  for (const spouse of spouses) {
    if (!globalRenderedCIDs.has(spouse.cid)) {
      const spouseNode = await makeNode(spouse, "Spouse", "target-level")
      targetLevel.append(spouseNode)
      globalRenderedCIDs.add(spouse.cid)
    }
  }

  wrapper.append(targetLevel)

  // Children Level
  if (children.length > 0) {
    const childrenLevel = document.createElement("div")
    childrenLevel.className = "tree-level children-level"

    for (const child of children) {
      if (!globalRenderedCIDs.has(child.cid)) {
        const childNode = await makeNode(child, "Child", "children-level")
        childrenLevel.append(childNode)
        globalRenderedCIDs.add(child.cid)
      }
    }

    wrapper.append(childrenLevel)
  }

  console.log(`✅ Degree 1: Target + ${spouses.length} spouses + ${children.length} children`)
}

async function buildDegreeTwo(wrapper, relationships) {
  const { target, spouses, parents, targetSiblings, spouseSiblings } = relationships

  // Parents Level - Include both target's parents AND spouse's parents
  const allParents = [...parents]

  // Add spouse's parents
  for (const spouse of spouses) {
    if (spouse.fatherCIDNo) {
      const spouseFather = await fetchCitizen(spouse.fatherCIDNo)
      if (spouseFather && !allParents.find((p) => p.cid === spouseFather.cid)) {
        allParents.push(spouseFather)
      }
    }
    if (spouse.motherCIDNo) {
      const spouseMother = await fetchCitizen(spouse.motherCIDNo)
      if (spouseMother && !allParents.find((p) => p.cid === spouseMother.cid)) {
        allParents.push(spouseMother)
      }
    }
  }

  if (allParents.length > 0) {
    const parentsLevel = document.createElement("div")
    parentsLevel.className = "tree-level parents-level"

    for (const parent of allParents) {
      if (!globalRenderedCIDs.has(parent.cid)) {
        let label = "Parent"

        // Determine if this is target's parent or spouse's parent
        if (parent.cid === target.fatherCIDNo) {
          label = "Father"
        } else if (parent.cid === target.motherCIDNo) {
          label = "Mother"
        } else {
          // Check if this is a spouse's parent
          for (const spouse of spouses) {
            if (parent.cid === spouse.fatherCIDNo) {
              label = `Father of ${spouse.fullName || spouse.firstName}`
              break
            } else if (parent.cid === spouse.motherCIDNo) {
              label = `Mother of ${spouse.fullName || spouse.firstName}`
              break
            }
          }
        }

        const parentNode = await makeNode(parent, label, "parents-level")
        parentsLevel.append(parentNode)
        globalRenderedCIDs.add(parent.cid)
      }
    }

    wrapper.insertBefore(parentsLevel, wrapper.firstChild)
  }

  // Enhanced Target + Siblings + Spouse + Spouse Siblings Level
  const enhancedTargetLevel = document.createElement("div")
  enhancedTargetLevel.className = "tree-level enhanced-target-level"

  // Add target siblings first (left side)
  for (const sibling of targetSiblings) {
    if (!globalRenderedCIDs.has(sibling.cid)) {
      const siblingNode = await makeNode(sibling, "Sibling", "target-siblings-level")
      enhancedTargetLevel.append(siblingNode)
      globalRenderedCIDs.add(sibling.cid)
    }
  }

  // Add target and spouse (center)
  const targetLevel = wrapper.querySelector(".target-level")
  if (targetLevel) {
    const targetNodes = Array.from(targetLevel.querySelectorAll(".tree-node"))
    targetNodes.forEach((node) => {
      enhancedTargetLevel.append(node)
    })
    targetLevel.remove()
  }

  // Add spouse siblings (right side)
  for (const spouseSibling of spouseSiblings) {
    if (!globalRenderedCIDs.has(spouseSibling.cid)) {
      const spouseSiblingNode = await makeNode(spouseSibling, "Spouse Sibling", "spouse-siblings-level")
      enhancedTargetLevel.append(spouseSiblingNode)
      globalRenderedCIDs.add(spouseSibling.cid)
    }
  }

  // Replace target level with enhanced level
  const childrenLevel = wrapper.querySelector(".children-level")
  if (childrenLevel) {
    wrapper.insertBefore(enhancedTargetLevel, childrenLevel)
  } else {
    wrapper.append(enhancedTargetLevel)
  }

  console.log(
    `✅ Degree 2: Added ${allParents.length} parents (including spouse parents) + ${targetSiblings.length} target siblings + ${spouseSiblings.length} spouse siblings`,
  )
}

async function buildDegreeThree(wrapper, relationships) {
  const { parents, grandparents, siblingsExtended } = relationships

  // Grandparents Level
  if (grandparents.length > 0 || parents.length > 0) {
    const grandparentsLevel = document.createElement("div")
    grandparentsLevel.className = "tree-level grandparents-level"

    // Add existing grandparents
    for (const grandparent of grandparents) {
      if (!globalRenderedCIDs.has(grandparent.cid)) {
        const grandparentNode = await makeNode(grandparent, "Grandparent", "grandparents-level")
        grandparentsLevel.append(grandparentNode)
        globalRenderedCIDs.add(grandparent.cid)
      }
    }

    // Fetch additional grandparents
    for (const parent of parents) {
      if (parent.fatherCIDNo) {
        const grandfather = await fetchCitizen(parent.fatherCIDNo)
        if (grandfather && !globalRenderedCIDs.has(grandfather.cid)) {
          const label =
            parent.cid === relationships.target.fatherCIDNo ? "Paternal Grandfather" : "Maternal Grandfather"
          const grandfatherNode = await makeNode(grandfather, label, "grandparents-level")
          grandparentsLevel.append(grandfatherNode)
          globalRenderedCIDs.add(grandfather.cid)
        }
      }

      if (parent.motherCIDNo) {
        const grandmother = await fetchCitizen(parent.motherCIDNo)
        if (grandmother && !globalRenderedCIDs.has(grandmother.cid)) {
          const label =
            parent.cid === relationships.target.fatherCIDNo ? "Paternal Grandmother" : "Maternal Grandmother"
          const grandmotherNode = await makeNode(grandmother, label, "grandparents-level")
          grandparentsLevel.append(grandmotherNode)
          globalRenderedCIDs.add(grandmother.cid)
        }
      }
    }

    if (grandparentsLevel.childElementCount > 0) {
      wrapper.insertBefore(grandparentsLevel, wrapper.firstChild)
    }
  }

  // Siblings' Extended Families with Clean Design
  if (siblingsExtended.length > 0) {
    const extendedLevel = document.createElement("div")
    extendedLevel.className = "tree-level extended-level"

    for (const siblingFamily of siblingsExtended) {
      if (siblingFamily.spouses.length > 0 || siblingFamily.children.length > 0) {
        const familyGroup = await createCleanSiblingFamilyGroup(siblingFamily)
        if (familyGroup) {
          extendedLevel.append(familyGroup)
        }
      }
    }

    if (extendedLevel.childElementCount > 0) {
      wrapper.append(extendedLevel)
    }
  }

  console.log(`✅ Degree 3: Added grandparents + ${siblingsExtended.length} sibling families`)
}

async function createCleanSiblingFamilyGroup(siblingFamily) {
  const { sibling, spouses, children } = siblingFamily

  const familyGroup = document.createElement("div")
  familyGroup.className = "sibling-family-group"
  familyGroup.setAttribute("data-family-head", sibling.cid)

  // Parents level (sibling + spouses)
  if (spouses.length > 0) {
    const parentsDiv = document.createElement("div")
    parentsDiv.className = "sibling-family-parents"

    // Add sibling first
    if (!globalRenderedCIDs.has(sibling.cid)) {
      const siblingLabel = `${sibling.fullName || sibling.firstName || "Sibling"} (Sibling)`
      const siblingNode = await makeNode(sibling, siblingLabel, "extended-level")
      parentsDiv.append(siblingNode)
      globalRenderedCIDs.add(sibling.cid)
    }

    // Add spouses with improved labeling
    for (const spouse of spouses) {
      if (!globalRenderedCIDs.has(spouse.cid)) {
        const spouseLabel = `Spouse of ${sibling.fullName || sibling.firstName || "Sibling"}`
        const spouseNode = await makeNode(spouse, spouseLabel, "extended-level")
        parentsDiv.append(spouseNode)
        globalRenderedCIDs.add(spouse.cid)
      }
    }

    familyGroup.append(parentsDiv)
  }

  // Children level
  if (children.length > 0) {
    const childrenDiv = document.createElement("div")
    childrenDiv.className = "sibling-family-children"

    for (const child of children) {
      if (!globalRenderedCIDs.has(child.cid)) {
        const childLabel = `Child of ${sibling.fullName || sibling.firstName || "Sibling"}`
        const childNode = await makeNode(child, childLabel, "extended-level")
        childrenDiv.append(childNode)
        globalRenderedCIDs.add(child.cid)
      }
    }

    familyGroup.append(childrenDiv)
  }

  return familyGroup.childElementCount > 0 ? familyGroup : null
}

function drawProfessionalConnectors() {
  const tree = document.getElementById("familyTreeContainer")
  const existingSVG = document.getElementById("connectorSVG")
  if (existingSVG) existingSVG.remove()

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
  svg.id = "connectorSVG"
  svg.classList.add("connector-layer")

  const treeRect = tree.getBoundingClientRect()
  svg.setAttribute("width", treeRect.width)
  svg.setAttribute("height", treeRect.height)
  svg.style.width = treeRect.width + "px"
  svg.style.height = treeRect.height + "px"

  tree.appendChild(svg)

  // Enhanced connection drawing
  connectTreeLevels(svg, tree, treeRect)
  connectSpouses(svg, tree, treeRect)
  connectSiblingFamilyGroups(svg, tree, treeRect)
}

function connectTreeLevels(svg, tree, treeRect) {
  const levels = Array.from(tree.querySelectorAll(".tree-level"))

  for (let i = 0; i < levels.length - 1; i++) {
    const currentLevel = levels[i]
    const nextLevel = levels[i + 1]

    if (nextLevel.classList.contains("extended-level")) {
      const siblingsLevel = tree.querySelector(".enhanced-target-level")
      if (siblingsLevel) {
        connectSiblingsToFamilies(svg, siblingsLevel, nextLevel, treeRect)
      }
    } else {
      connectParentChild(svg, currentLevel, nextLevel, treeRect)
    }
  }
}

function connectParentChild(svg, parentLevel, childLevel, treeRect) {
  const parents = Array.from(parentLevel.querySelectorAll(".tree-node"))
  const children = Array.from(childLevel.querySelectorAll(".tree-node"))

  if (parents.length === 0 || children.length === 0) return

  // Enhanced parent-child connection logic
  const parentChildMap = new Map()

  children.forEach((child) => {
    const fatherCID = child.getAttribute("data-father")
    const motherCID = child.getAttribute("data-mother")

    parents.forEach((parent) => {
      const parentCID = parent.getAttribute("data-cid")
      if (parentCID === fatherCID || parentCID === motherCID) {
        if (!parentChildMap.has(parentCID)) {
          parentChildMap.set(parentCID, [])
        }
        parentChildMap.get(parentCID).push(child)
      }
    })
  })

  // Draw enhanced connections
  parentChildMap.forEach((childrenGroup, parentCID) => {
    const parent = parents.find((p) => p.getAttribute("data-cid") === parentCID)
    if (parent && childrenGroup.length > 0) {
      drawEnhancedParentChildLines(svg, [parent], childrenGroup, treeRect)
    }
  })
}

function drawEnhancedParentChildLines(svg, parents, children, treeRect) {
  if (parents.length === 0 || children.length === 0) return

  // Calculate parent connection point (bottom center)
  let parentCenterX, parentBottom
  if (parents.length === 1) {
    const parentRect = parents[0].getBoundingClientRect()
    parentCenterX = parentRect.left + parentRect.width / 2 - treeRect.left
    parentBottom = parentRect.bottom - treeRect.top
  } else {
    const firstParent = parents[0].getBoundingClientRect()
    const lastParent = parents[parents.length - 1].getBoundingClientRect()
    parentCenterX =
      (firstParent.left + firstParent.width / 2 + lastParent.left + lastParent.width / 2) / 2 - treeRect.left
    parentBottom = Math.max(firstParent.bottom, lastParent.bottom) - treeRect.top
  }

  if (children.length === 1) {
    // Single child - direct line from parent bottom to child top
    const childRect = children[0].getBoundingClientRect()
    const childCenterX = childRect.left + childRect.width / 2 - treeRect.left
    const childTop = childRect.top - treeRect.top

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line")
    line.setAttribute("x1", parentCenterX)
    line.setAttribute("y1", parentBottom)
    line.setAttribute("x2", childCenterX)
    line.setAttribute("y2", childTop)
    line.classList.add("connector-line", "parent-child-line")
    svg.appendChild(line)
  } else {
    // Multiple children - T-junction from sides
    const firstChild = children[0].getBoundingClientRect()
    const lastChild = children[children.length - 1].getBoundingClientRect()
    const horizontalY = firstChild.top - treeRect.top - 20

    // Horizontal line connecting all children
    const horizontalLine = document.createElementNS("http://www.w3.org/2000/svg", "line")
    horizontalLine.setAttribute("x1", firstChild.left + firstChild.width / 2 - treeRect.left)
    horizontalLine.setAttribute("y1", horizontalY)
    horizontalLine.setAttribute("x2", lastChild.left + lastChild.width / 2 - treeRect.left)
    horizontalLine.setAttribute("y2", horizontalY)
    horizontalLine.classList.add("connector-line", "parent-child-line")
    svg.appendChild(horizontalLine)

    // Vertical lines from horizontal line to each child (from top of child)
    children.forEach((child) => {
      const childRect = child.getBoundingClientRect()
      const childCenterX = childRect.left + childRect.width / 2 - treeRect.left
      const childTop = childRect.top - treeRect.top

      const vertLine = document.createElementNS("http://www.w3.org/2000/svg", "line")
      vertLine.setAttribute("x1", childCenterX)
      vertLine.setAttribute("y1", childTop)
      vertLine.setAttribute("x2", childCenterX)
      vertLine.setAttribute("y2", horizontalY)
      vertLine.classList.add("connector-line", "parent-child-line")
      svg.appendChild(vertLine)
    })

    // Main line from parent to center of horizontal line
    const childrenCenterX =
      (firstChild.left + firstChild.width / 2 + lastChild.left + lastChild.width / 2) / 2 - treeRect.left
    const parentLine = document.createElementNS("http://www.w3.org/2000/svg", "line")
    parentLine.setAttribute("x1", parentCenterX)
    parentLine.setAttribute("y1", parentBottom)
    parentLine.setAttribute("x2", childrenCenterX)
    parentLine.setAttribute("y2", horizontalY)
    parentLine.classList.add("connector-line", "parent-child-line")
    svg.appendChild(parentLine)
  }
}

function connectSpouses(svg, tree, treeRect) {
  const levels = Array.from(tree.querySelectorAll(".tree-level"))

  levels.forEach((level) => {
    const nodes = Array.from(level.querySelectorAll(".tree-node"))

    for (let i = 0; i < nodes.length - 1; i++) {
      const node1 = nodes[i]
      const node2 = nodes[i + 1]

      const label1 = node1.getAttribute("data-label").toLowerCase()
      const label2 = node2.getAttribute("data-label").toLowerCase()

      if (
        (label1.includes("target") && label2.includes("spouse")) ||
        (label1.includes("spouse") && label2.includes("target")) ||
        (label1.includes("father") && label2.includes("mother")) ||
        (label1.includes("mother") && label2.includes("father"))
      ) {
        const rect1 = node1.getBoundingClientRect()
        const rect2 = node2.getBoundingClientRect()

        const y = rect1.top + rect1.height / 2 - treeRect.top
        const x1 = rect1.right - treeRect.left
        const x2 = rect2.left - treeRect.left

        if (Math.abs(x2 - x1) < 150) {
          const spouseLine = document.createElementNS("http://www.w3.org/2000/svg", "line")
          spouseLine.setAttribute("x1", x1)
          spouseLine.setAttribute("y1", y)
          spouseLine.setAttribute("x2", x2)
          spouseLine.setAttribute("y2", y)
          spouseLine.classList.add("connector-line", "spouse-line")
          svg.appendChild(spouseLine)
        }
      }
    }
  })
}

function connectSiblingsToFamilies(svg, siblingsLevel, extendedLevel, treeRect) {
  const siblings = Array.from(siblingsLevel.querySelectorAll(".tree-node"))
  const familyGroups = Array.from(extendedLevel.querySelectorAll(".sibling-family-group"))

  familyGroups.forEach((group) => {
    const familyHead = group.getAttribute("data-family-head")
    const sibling = siblings.find((s) => s.getAttribute("data-cid") === familyHead)

    if (sibling) {
      const siblingRect = sibling.getBoundingClientRect()
      const groupRect = group.getBoundingClientRect()

      // Calculate connection points to avoid crossing through main family
      const siblingCenterX = siblingRect.left + siblingRect.width / 2 - treeRect.left
      const siblingBottom = siblingRect.bottom - treeRect.top

      const groupCenterX = groupRect.left + groupRect.width / 2 - treeRect.left
      const groupTop = groupRect.top - treeRect.top

      // Create a curved path that goes around the main family area
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path")

      // Calculate intermediate points to route around main family
      const midY = siblingBottom + 30 // Start going down from sibling
      const curveY = groupTop - 30 // Approach extended family from above

      // Create smooth curved path
      const pathData = `M ${siblingCenterX} ${siblingBottom} 
                       L ${siblingCenterX} ${midY}
                       Q ${siblingCenterX} ${midY + 20} ${(siblingCenterX + groupCenterX) / 2} ${midY + 20}
                       Q ${groupCenterX} ${midY + 20} ${groupCenterX} ${curveY}
                       L ${groupCenterX} ${groupTop}`

      path.setAttribute("d", pathData)
      path.classList.add("connector-line", "sibling-line")
      path.style.fill = "none"
      path.style.stroke = "#8b5cf6"
      path.style.strokeWidth = "2"
      path.style.strokeDasharray = "3, 3"

      svg.appendChild(path)
    }
  })
}

function connectSiblingFamilyGroups(svg, tree, treeRect) {
  const familyGroups = Array.from(tree.querySelectorAll(".sibling-family-group"))

  familyGroups.forEach((group) => {
    const parents = Array.from(group.querySelectorAll(".sibling-family-parents .tree-node"))
    const children = Array.from(group.querySelectorAll(".sibling-family-children .tree-node"))

    if (parents.length > 0 && children.length > 0) {
      drawEnhancedParentChildLines(svg, parents, children, treeRect)
    }

    if (parents.length > 1) {
      connectSpouses(svg, group, treeRect)
    }
  })
}

// Event handlers
window.addEventListener("resize", () => {
  setTimeout(drawProfessionalConnectors, 200)
})

let scale = 1
const tree = document.getElementById("familyTreeContainer")

document.getElementById("zoomIn").onclick = () => {
  scale = Math.min(scale + 0.1, 2)
  tree.style.transform = `scale(${scale})`
  setTimeout(drawProfessionalConnectors, 200)
}

document.getElementById("zoomOut").onclick = () => {
  scale = Math.max(scale - 0.1, 0.5)
  tree.style.transform = `scale(${scale})`
  setTimeout(drawProfessionalConnectors, 200)
}

document.getElementById("saveImage").onclick = () => {
  const loadingToast = showToast("Generating family tree image...", "info", 10000)

  window
    .html2canvas(tree, { scale: 2 })
    .then((canvas) => {
      removeToast(loadingToast)
      const a = document.createElement("a")
      a.download = "family-tree.png"
      a.href = canvas.toDataURL()
      a.click()
      showToast("Family tree image saved successfully!", "success")
    })
    .catch((err) => {
      removeToast(loadingToast)
      console.error("Error generating image:", err)
      showToast("Failed to generate image. Please try again.", "error")
    })
}

document.getElementById("exportPDF").onclick = async () => {
  const iframe = document.getElementById("detailIframe")
  const iframeDoc = iframe.contentDocument || iframe.contentWindow.document
  const container = iframeDoc.querySelector(".content-container")

  if (!container) {
    showToast("Unable to export PDF. Please ensure the detail view is loaded.", "error")
    return
  }

  const loadingToast = showToast("Generating PDF export...", "info", 15000)

  try {
    const canvas = await window.html2canvas(container, { scale: 2 })
    const imgData = canvas.toDataURL("image/png")
    const { jsPDF } = window.jspdf
    const pdf = new jsPDF("p", "mm", "a4")
    const pdfWidth = 210
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight)
    pdf.save("citizen-profile.pdf")

    removeToast(loadingToast)
    showToast("PDF exported successfully!", "success")
  } catch (err) {
    removeToast(loadingToast)
    console.error("Error generating PDF:", err)
    showToast("Failed to export PDF. Please try again.", "error")
  }
}
document.getElementById("exportImage").onclick = async () => {
  const iframe = document.getElementById("detailIframe")
  const iframeDoc = iframe.contentDocument || iframe.contentWindow.document
  const container = iframeDoc.querySelector(".content-container")

  if (!container) {
    showToast("Unable to save image. Please ensure the detail view is loaded.", "error")
    return
  }

  const loadingToast = showToast("Generating image export...", "info", 10000)

  try {
    const canvas = await window.html2canvas(container, { scale: 2 })
    const imgData = canvas.toDataURL("image/png")
    const link = document.createElement("a")
    link.href = imgData
    link.download = "citizen-profile.png"
    link.click()

    removeToast(loadingToast)
    showToast("Image saved successfully!", "success")
  } catch (err) {
    removeToast(loadingToast)
    console.error("Error generating image:", err)
    showToast("Failed to save image. Please try again.", "error")
  }
}

window.loadImage = loadImage
