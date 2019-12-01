const bcrypt = require('bcrypt-nodejs');
const pool = require('./connection');

// Just for demo purpose. You should not be hard-coding IDs here
const operatingSystems = {
  Scarfs: 1,
  Shoes: 2,
  Handbag: 3,
  Jewelries: 4,
  Dresses: 5,
};
const processors = {
  S: 1,
  M: 2,
  L: 3,
  XL: 4,
  XXL: 5,
};
const brands = {
  Decoration: 1,
  Accessories: 2,
  Clothes: 3,
  Gifts: 4,
  Wallets: 5,
  Bags: 6,
  Furniture: 7,
  Crochet: 8,
};
const storageTypes = {
  Men: 1,
  Women: 2,
};

/**
 * Returns true is the URL provided is an image
 * Checks just the extension of the URL for now
 * @param {string} uri Image URL
 */
function isImage(uri) {
  // remove params
  [uri] = uri.split('?');
  const parts = uri.split('.');
  const extension = parts[parts.length - 1];
  const imageTypes = ['jpg', 'jpeg', 'tiff', 'png', 'gif', 'bmp'];
  if (imageTypes.indexOf(extension) !== -1) {
    return true;
  }
  return false;
}

const routes = {
  newLaptop: async (req, res) => {
    const { laptop } = req.body;
    const result = {};
    const errors = [];
    if (laptop) {
      const keys = Object.keys(laptop);
      console.log(keys);
      for (let idx = 0; idx < keys.length; idx += 1) {
        if (keys[idx] !== 'ram' && keys[idx] !== 'storage') {
          switch (keys[idx]) {
            case 'title': {
              if (laptop.title) {
                result.title = laptop.title.trim();
              } else {
                errors.push('Laptop Name');
              }
              break;
            }
            case 'description': {
              const description = [];
              laptop.description.forEach((value) => {
                if (value.trim()) {
                  description.push(value);
                }
              });
              if (description.length > 0) {
                result.description = description;
              } else {
                errors.push('Laptop Description');
              }
              break;
            }
            case 'image': {
              if (laptop.image) {
                const isTrue = isImage(laptop.image.trim());
                if (isTrue) {
                  result.image = laptop.image.trim();
                } else {
                  errors.push('Image URL');
                }
              } else {
                errors.push('Image URL');
              }
              break;
            }
            case 'os': {
              if (laptop.os) {
                result.os = laptop.os.trim();
              } else {
                errors.push('OS Name');
              }
              break;
            }
            case 'processor': {
              if (laptop.processor) {
                result.processor = laptop.processor;
              } else {
                errors.push('Processor');
              }
              break;
            }
            case 'storageType': {
              if (laptop.storageType) {
                result.storageType = laptop.storageType;
              } else {
                errors.push('Storage Type');
              }
              break;
            }
            case 'brand': {
              if (laptop.brand) {
                result.brand = laptop.brand;
              } else {
                errors.push('Brand Name');
              }
              break;
            }
            case 'price': {
              const price = parseFloat(laptop.price) || null;
              if (price) {
                result.price = price;
              } else {
                errors.push('Price');
              }
              break;
            }
            case 'rating': {
              const rating = parseFloat(laptop.rating) || null;
              if (rating && (rating <= 5 && rating >= 1)) {
                result.rating = rating;
              } else {
                errors.push('Rating');
              }
              break;
            }
            case 'limit': {
              /* do nothing */
              break;
            }
            default: {
              errors.push('Inavlid entry sent');
            }
          }
        }
      }
      if (errors.length === 0) {
        const query = `INSERT INTO laptops (name, os_id, processor_id, brand_id, img, ram, storage_type_id, storage, rating, price, img_big, description)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id;`;
        try {
          const insert = await pool.query(query, [
            result.title,
            operatingSystems[result.os],
            processors[result.processor],
            brands[result.brand],
            result.image,
            0,
            storageTypes[result.storageType],
            0,
            result.rating,
            result.price,
            result.image,
            result.description,
          ]);
          res.status(200)
            .json({
              success: true,
              id: insert.rows[0].id,
            });
        } catch (err) {
          errors.push('Internal Server Error');
          res.status(500)
            .json({
              success: false,
              errors,
            });
        }
      } else {
        res.status(400)
          .json({
            success: false,
            errors,
          });
      }
    } else {
      errors.push('Invalid data sent by the client');
      res.status(400)
        .json({
          success: false,
          errors,
        });
    }
  },
  newUser: async (req, res) => {
    try {
      const query = 'INSERT INTO customers(given_name , fullname,email,password,local) VALUES ($1, $2, $3,$4,$5) RETURNING id ;';
      const data = req.body;
      bcrypt.genSalt(10, function (err, salt) {
        bcrypt.hash(data.password, salt, null, function (error, hashed) {
          if (!error) {
            const result = pool.query(query, [data.username, data.username, data.username, hashed, true]);
            if (result) {
              res.status(200)
                .json({ success: true });
            } else {
              res.status(500)
                .json({
                  success: false,
                  error: 'cant hash!',
                });
            }
          } else {
            res.status(500)
              .json({
                success: false,
                error,
              });
          }
        });
      });
    } catch (e) {
      res.status(500)
        .json({
          success: false,
          error: e,
        });
    }
  }
  ,
};

module.exports = routes;
