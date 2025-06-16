const { getCitizenById, getHouseholdByNumber, getImageByCID } = require('../services/familyTreeService');

exports.getCitizen = async (req, res) => {
  try {
    const cid = req.params.cid;
    const citizen = await getCitizenById(cid);
    res.json({ citizen });
  } catch (err) {
    console.error('Error fetching citizen:', err);
    res.status(500).json({ error: 'Failed to fetch citizen data' });
  }
};

exports.getHousehold = async (req, res) => {
  try {
    const hh = req.params.householdNo;
    const household = await getHouseholdByNumber(hh);
    res.json({ household });
  } catch (err) {
    console.error('Error fetching household:', err);
    res.status(500).json({ error: 'Failed to fetch household data' });
  }
};

exports.getImage = async (req, res) => {
  try {
    const cid = req.params.cid;
    const image = await getImageByCID(cid);
    res.json({ image });
  } catch (err) {
    console.error('Error fetching image:', err);
    res.status(500).json({ error: 'Failed to fetch image' });
  }
};
