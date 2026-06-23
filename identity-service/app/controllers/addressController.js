const { getUser, getAddress } = require('../models/User');

exports.getAddresses = async (req, res) => {
  try {
    const Address = getAddress();
    const addresses = await Address.findAll({
      where: { user_id: req.user.id },
      order: [['is_default', 'DESC'], ['created_at', 'DESC']]
    });
    res.json({ success: true, data: addresses });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.addAddress = async (req, res) => {
  try {
    const Address = getAddress();
    const { fullName, phone, province, district, ward, street, isDefault } = req.body;
    if (!fullName || !phone || !province || !district || !street) {
      return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin địa chỉ' });
    }
    if (isDefault) {
      await Address.update({ is_default: false }, { where: { user_id: req.user.id } });
    }
    const count = await Address.count({ where: { user_id: req.user.id } });
    await Address.create({
      user_id: req.user.id,
      full_name: fullName,
      phone,
      province,
      district,
      ward: ward || '',
      street,
      is_default: isDefault || count === 0
    });
    const addresses = await Address.findAll({ where: { user_id: req.user.id } });
    res.status(201).json({ success: true, data: addresses });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updateAddress = async (req, res) => {
  try {
    const Address = getAddress();
    const { addressId } = req.params;
    const { fullName, phone, province, district, ward, street, isDefault } = req.body;
    const address = await Address.findOne({
      where: { id: addressId, user_id: req.user.id }
    });
    if (!address) {
      return res.status(404).json({ error: 'Địa chỉ không tồn tại' });
    }
    if (isDefault) {
      await Address.update({ is_default: false }, { where: { user_id: req.user.id } });
    }
    await address.update({
      full_name: fullName ?? address.full_name,
      phone: phone ?? address.phone,
      province: province ?? address.province,
      district: district ?? address.district,
      ward: ward ?? address.ward,
      street: street ?? address.street,
      is_default: isDefault ?? address.is_default
    });
    const addresses = await Address.findAll({ where: { user_id: req.user.id } });
    res.json({ success: true, data: addresses });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteAddress = async (req, res) => {
  try {
    const Address = getAddress();
    const { addressId } = req.params;
    const address = await Address.findOne({
      where: { id: addressId, user_id: req.user.id }
    });
    if (!address) {
      return res.status(404).json({ error: 'Địa chỉ không tồn tại' });
    }
    await address.destroy();
    const addresses = await Address.findAll({ where: { user_id: req.user.id } });
    res.json({ success: true, data: addresses });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.setDefaultAddress = async (req, res) => {
  try {
    const Address = getAddress();
    const { addressId } = req.params;
    await Address.update({ is_default: false }, { where: { user_id: req.user.id } });
    await Address.update(
      { is_default: true },
      { where: { id: addressId, user_id: req.user.id } }
    );
    const addresses = await Address.findAll({ where: { user_id: req.user.id } });
    res.json({ success: true, data: addresses });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};