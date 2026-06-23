const { getProduct, getBrand, getCategory } = require('../models');
const { Op } = require('sequelize');
const ResponseHelper = require('../helpers/response.helper');

function generateSlug(name) {
  return name.toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/[^a-z0-9\s-]/g, '')
    .trim().replace(/\s+/g, '-').replace(/-+/g, '-');
}

exports.createProduct = async (req, res) => {
  try {
    const Product = getProduct();
    const Brand = getBrand();
    const Category = getCategory();
    const { name, brand, category, description, price, originalPrice, images, availableSizes, availableColors, stock, gender, material, sole, tags, isXakho, isFeatured, isNewArrival } = req.body;

    if (!name || !price || !category) return ResponseHelper.error(res, 'Name, price, category are required', 400);

    // Tìm brand_id từ tên hoặc dùng trực tiếp nếu là số
    let brand_id = null;
    if (brand) {
      if (!isNaN(brand)) {
        brand_id = Number(brand);
      } else {
        const b = await Brand.findOne({ where: { name: brand } });
        if (b) brand_id = b.id;
      }
    }

    // Tìm category_id từ tên hoặc dùng trực tiếp nếu là số
    let category_id = null;
    if (!isNaN(category)) {
      category_id = Number(category);
    } else {
      const c = await Category.findOne({ where: { name: category } });
      if (c) category_id = c.id;
    }
    if (!category_id) return ResponseHelper.error(res, 'Category not found', 400);

    const slug = generateSlug(name) + '-' + Date.now();
    const product = await Product.create({
      name, slug, brand_id, category_id, description,
      price, original_price: originalPrice,
      images: images || [],
      available_sizes: availableSizes || [],
      available_colors: availableColors || [],
      stock: stock || 0, gender, material, sole,
      tags: tags || [],
      is_xakho: isXakho || false,
      is_featured: isFeatured || false,
      is_new_arrival: isNewArrival || false,
    });

    return ResponseHelper.success(res, product, 'Product created successfully', 201);
  } catch (err) {
    return ResponseHelper.error(res, err.message, 400);
  }
};

exports.getProducts = async (req, res) => {
  try {
    const Product = getProduct();
    const Brand = getBrand();
    const Category = getCategory();
    const { page = 1, limit = 12, category, brand, minPrice, maxPrice, search, sort = '-created_at', footType, showAll } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where = {};
    if (showAll !== 'true') {
      where.is_active = true;
    }

    // Hỗ trợ cả category ID (số) và slug (chuỗi)
    if (category) {
      if (!isNaN(category)) {
        where.category_id = Number(category);
      } else if (category === 'giay-bong-da') {
        const cats = await Category.findAll({
          where: {
            slug: [
              'giay-bong-da',
              'giay-bong-da-san-co-nhan-tao',
              'giay-bong-da-san-co-tu-nhien',
              'giay-futsal'
            ]
          }
        });
        where.category_id = { [Op.in]: cats.map(c => c.id) };
      } else {
        const cat = await Category.findOne({ where: { slug: category } });
        if (cat) where.category_id = cat.id;
      }
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[Op.gte] = Number(minPrice);
      if (maxPrice) where.price[Op.lte] = Number(maxPrice);
    }
    if (search) where.name = { [Op.like]: `%${search}%` };
    if (brand) {
      const brandArray = Array.isArray(brand) ? brand : [brand];
      const brands = await Brand.findAll({ where: { [Op.or]: brandArray.map(b => isNaN(b) ? { slug: b } : { id: Number(b) }) } });
      where.brand_id = { [Op.in]: brands.map(b => b.id) };
    }
    // Lọc theo loại hình dáng bàn chân (chân bè / chân thon)
    if (footType && ['be', 'thon', 'unisex'].includes(footType)) {
      where.foot_type = footType;
    }

    const order = sort.startsWith('-') ? [[sort.slice(1), 'DESC']] : [[sort, 'ASC']];
    const { count, rows: products } = await Product.findAndCountAll({
      where, include: [
        { model: Brand, as: 'brand', attributes: ['id', 'name', 'slug'] },
        { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] }
      ],
      order, limit: Number(limit), offset
    });

    return ResponseHelper.paginated(res, products, {
      currentPage: Number(page),
      totalPages: Math.ceil(count / Number(limit)),
      total: count, limit: Number(limit)
    }, 'Products retrieved successfully');
  } catch (err) {
    return ResponseHelper.error(res, err.message, 400);
  }
};

exports.getProduct = async (req, res) => {
  try {
    const Product = getProduct();
    const Brand = getBrand();
    const Category = getCategory();
    const product = await Product.findByPk(req.params.id, {
      include: [
        { model: Brand, as: 'brand' },
        { model: Category, as: 'category' }
      ]
    });
    if (!product) return ResponseHelper.error(res, 'Product not found', 404);
    return ResponseHelper.success(res, product, 'Product retrieved successfully');
  } catch (err) {
    return ResponseHelper.error(res, err.message, 400);
  }
};

exports.getProductBySlug = async (req, res) => {
  try {
    const Product = getProduct();
    const Brand = getBrand();
    const Category = getCategory();
    const product = await Product.findOne({
      where: { slug: req.params.slug },
      include: [
        { model: Brand, as: 'brand' },
        { model: Category, as: 'category' }
      ]
    });
    if (!product) return ResponseHelper.error(res, 'Product not found', 404);

    const relatedProducts = await Product.findAll({
      where: {
        id: { [Op.ne]: product.id },
        [Op.or]: [{ category_id: product.category_id }, { brand_id: product.brand_id }],
        is_active: true
      },
      attributes: ['id', 'name', 'slug', 'price', 'images', 'rating'],
      limit: 4
    });

    return ResponseHelper.success(res, { ...product.toJSON(), relatedProducts }, 'Product retrieved successfully');
  } catch (err) {
    return ResponseHelper.error(res, err.message, 400);
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const Product = getProduct();
    const product = await Product.findOne({
      where: isNaN(req.params.identifier)
        ? { slug: req.params.identifier }
        : { id: req.params.identifier }
    });
    if (!product) return ResponseHelper.error(res, 'Product not found', 404);
    await product.update(req.body);
    return ResponseHelper.success(res, product, 'Product updated successfully');
  } catch (err) {
    return ResponseHelper.error(res, err.message, 400);
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const Product = getProduct();
    const product = await Product.findByPk(req.params.identifier) ||
      await Product.findOne({ where: { slug: req.params.identifier } });
    if (!product) return ResponseHelper.error(res, 'Product not found', 404);
    await product.destroy();
    return ResponseHelper.success(res, { id: product.id }, 'Product deleted successfully');
  } catch (err) {
    return ResponseHelper.error(res, err.message, 400);
  }
};

exports.getXakhoProducts = async (req, res) => {
  try {
    const Product = getProduct();
    const Brand = getBrand();
    const Category = getCategory();
    const { page = 1, limit = 12 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const { count, rows: products } = await Product.findAndCountAll({
      where: { is_xakho: true, is_active: true },
      include: [{ model: Brand, as: 'brand' }, { model: Category, as: 'category' }],
      limit: Number(limit), offset
    });
    return ResponseHelper.paginated(res, products, { currentPage: Number(page), totalPages: Math.ceil(count / limit), total: count, limit: Number(limit) }, 'Clearance products retrieved');
  } catch (err) {
    return ResponseHelper.error(res, err.message, 400);
  }
};

exports.searchProducts = async (req, res) => {
  try {
    const Product = getProduct();
    const Brand = getBrand();
    const Category = getCategory();
    const { q, page = 1, limit = 12, category, brand, minPrice, maxPrice } = req.query;
    if (!q || q.trim().length < 1) return ResponseHelper.error(res, 'Search query required', 400);

    const offset = (Number(page) - 1) * Number(limit);
    const where = {
      is_active: true,
      name: { [Op.like]: `%${q.trim()}%` }
    };
    if (category) where.category_id = category;
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[Op.gte] = Number(minPrice);
      if (maxPrice) where.price[Op.lte] = Number(maxPrice);
    }

    const { count, rows: products } = await Product.findAndCountAll({
      where,
      include: [{ model: Brand, as: 'brand' }, { model: Category, as: 'category' }],
      limit: Number(limit), offset
    });
    return ResponseHelper.paginated(res, products, { currentPage: Number(page), totalPages: Math.ceil(count / limit), total: count, limit: Number(limit), query: q }, 'Search results');
  } catch (err) {
    return ResponseHelper.error(res, err.message, 400);
  }
};

exports.autocomplete = async (req, res) => {
  try {
    const Product = getProduct();
    const { q } = req.query;
    if (!q || q.trim().length < 1) return ResponseHelper.success(res, [], 'No suggestions');
    const products = await Product.findAll({
      where: { name: { [Op.like]: `${q.trim()}%` }, is_active: true },
      attributes: ['id', 'name', 'slug'], limit: 10
    });
    return ResponseHelper.success(res, products, 'Suggestions retrieved');
  } catch (err) {
    return ResponseHelper.error(res, err.message, 400);
  }
};

exports.reduceStock = async (req, res) => {
  try {
    const Product = getProduct();
    const { quantity } = req.body;
    const product = await Product.findOne({
      where: { id: req.params.id, stock: { [Op.gte]: quantity } }
    });
    if (!product) return res.status(400).json({ success: false, error: 'Sản phẩm không đủ số lượng hoặc không tồn tại' });
    await product.decrement('stock', { by: quantity });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.restoreStock = async (req, res) => {
  try {
    const Product = getProduct();
    const { quantity } = req.body;
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
    await product.increment('stock', { by: quantity });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.incrementSold = async (req, res) => {
  try {
    const Product = getProduct();
    const { quantity } = req.body;
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
    await product.increment('sold', { by: quantity });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};