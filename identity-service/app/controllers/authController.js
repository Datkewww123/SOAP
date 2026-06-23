const { getUser } = require('../models/User');
const { Op } = require('sequelize');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { env } = require('../config/environment');
const ApiError = require('../utils/ApiError');
const ResponseHelper = require('../helpers/response.helper');
const { httpStatus } = require('../constants/init');

exports.register = async (req, res, next) => {
  try {
    const User = getUser();
    const { email, username, password, name, phone, address } = req.body;

    const existingUser = await User.findOne({
      where: { [Op.or]: [{ email }, { username }] }
    });
    if (existingUser) {
      throw new ApiError(
        httpStatus.CONFLICT,
        existingUser.email === email
          ? 'Email đã được sử dụng'
          : 'Username đã được sử dụng'
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username, email,
      password: hashedPassword,
      name,
      phone: phone || '',
      address: address || '',
    });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );

    res.cookie('accessToken', token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000
    });

    const userResponse = user.toJSON();
    delete userResponse.password;

    return ResponseHelper.created(res, { token, user: userResponse }, 'Đăng ký thành công');
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const User = getUser();
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Email hoặc mật khẩu không đúng');
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Email hoặc mật khẩu không đúng');
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );

    res.cookie('accessToken', token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000
    });

    const userResponse = user.toJSON();
    delete userResponse.password;

    return ResponseHelper.success(res, { token, user: userResponse }, 'Đăng nhập thành công');
  } catch (err) {
    next(err);
  }
};

exports.profile = async (req, res, next) => {
  try {
    const User = getUser();
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy người dùng');
    }

    return ResponseHelper.success(res, user, 'Lấy thông tin thành công');
  } catch (err) {
    next(err);
  }
};

exports.logout = (req, res) => {
  res.clearCookie('accessToken', {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict'
  });

  return ResponseHelper.success(res, null, 'Đăng xuất thành công');
};