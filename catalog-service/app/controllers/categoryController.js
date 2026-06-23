const { getCategory } = require('../models');
const ResponseHelper = require('../helpers/response.helper');

function generateSlug(name) {
  return name.toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/[^a-z0-9\s-]/g, '')
    .trim().replace(/\s+/g, '-').replace(/-+/g, '-');
}

exports.createCategory = async (req, res) => {
  try {
    const Category = getCategory();
    const data = { ...req.body };
    if (!data.slug && data.name) data.slug = generateSlug(data.name);
    const category = await Category.create(data);
    return ResponseHelper.created(res, category, 'Category created successfully');
  } catch (err) {
    return ResponseHelper.error(res, err.message, 400);
  }
};

exports.getCategories = async (req, res) => {
  try {
    const Category = getCategory();
    const categories = await Category.findAll();
    return ResponseHelper.success(res, categories, 'Categories retrieved successfully');
  } catch (err) {
    return ResponseHelper.error(res, err.message, 400);
  }
};

exports.getCategoryBySlug = async (req, res) => {
  try {
    const Category = getCategory();
    const category = await Category.findOne({ where: { slug: req.params.slug } });
    if (!category) return ResponseHelper.notFound(res, 'Category not found');
    return ResponseHelper.success(res, category, 'Category retrieved successfully');
  } catch (err) {
    return ResponseHelper.error(res, err.message, 400);
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const Category = getCategory();
    const category = await Category.findByPk(req.params.id);
    if (!category) return ResponseHelper.notFound(res, 'Category not found');
    await category.update(req.body);
    return ResponseHelper.success(res, category, 'Category updated successfully');
  } catch (err) {
    return ResponseHelper.error(res, err.message, 400);
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const Category = getCategory();
    const category = await Category.findByPk(req.params.id);
    if (!category) return ResponseHelper.notFound(res, 'Category not found');
    await category.destroy();
    return ResponseHelper.success(res, null, 'Category deleted successfully');
  } catch (err) {
    return ResponseHelper.error(res, err.message, 400);
  }
};