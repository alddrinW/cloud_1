const express = require('express');
const router = express.Router();
const db = require('../db');

/**
 * @route   GET /api/items
 * @desc    Obtener lista de todos los elementos (permite filtro opcional por búsqueda ?search=)
 */
router.get('/', async (req, res, next) => {
  try {
    const { search } = req.query;
    let queryText = 'SELECT * FROM items ORDER BY id ASC';
    let params = [];

    if (search) {
      queryText = 'SELECT * FROM items WHERE name ILIKE $1 OR description ILIKE $1 ORDER BY id ASC';
      params = [`%${search}%`];
    }

    const { rows } = await db.query(queryText, params);
    return res.status(200).json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/items/:id
 * @desc    Obtener un elemento por su identificador único (ID)
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const itemId = parseInt(id, 10);

    if (isNaN(itemId)) {
      return res.status(400).json({
        success: false,
        error: 'El parámetro "id" debe ser un número entero válido.',
      });
    }

    const { rows } = await db.query('SELECT * FROM items WHERE id = $1', [itemId]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Elemento con id ${itemId} no encontrado.`,
      });
    }

    return res.status(200).json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/items
 * @desc    Crear un nuevo elemento en la base de datos
 */
router.post('/', async (req, res, next) => {
  try {
    const { name, description, price, status } = req.body;

    // Validaciones
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'El campo "name" es obligatorio y no puede estar vacío.',
      });
    }

    const numericPrice = price !== undefined ? parseFloat(price) : 0.0;
    if (isNaN(numericPrice) || numericPrice < 0) {
      return res.status(400).json({
        success: false,
        error: 'El campo "price" debe ser un número mayor o igual a 0.',
      });
    }

    const itemStatus = status ? String(status).trim() : 'available';

    const insertQuery = `
      INSERT INTO items (name, description, price, status)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const values = [name.trim(), description ? description.trim() : null, numericPrice, itemStatus];

    const { rows } = await db.query(insertQuery, values);

    return res.status(201).json({
      success: true,
      message: 'Elemento creado exitosamente.',
      data: rows[0],
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/items/:id
 * @desc    Actualizar un elemento existente por su ID
 */
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const itemId = parseInt(id, 10);

    if (isNaN(itemId)) {
      return res.status(400).json({
        success: false,
        error: 'El parámetro "id" debe ser un número entero válido.',
      });
    }

    // Verificar si el elemento existe
    const existing = await db.query('SELECT * FROM items WHERE id = $1', [itemId]);
    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Elemento con id ${itemId} no encontrado para actualizar.`,
      });
    }

    const current = existing.rows[0];
    const { name, description, price, status } = req.body;

    const newName = name !== undefined ? String(name).trim() : current.name;
    if (newName === '') {
      return res.status(400).json({
        success: false,
        error: 'El campo "name" no puede quedar vacío.',
      });
    }

    let newPrice = current.price;
    if (price !== undefined) {
      newPrice = parseFloat(price);
      if (isNaN(newPrice) || newPrice < 0) {
        return res.status(400).json({
          success: false,
          error: 'El campo "price" debe ser un número mayor o igual a 0.',
        });
      }
    }

    const newDescription = description !== undefined ? description : current.description;
    const newStatus = status !== undefined ? String(status).trim() : current.status;

    const updateQuery = `
      UPDATE items
      SET name = $1, description = $2, price = $3, status = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `;
    const values = [newName, newDescription, newPrice, newStatus, itemId];

    const { rows } = await db.query(updateQuery, values);

    return res.status(200).json({
      success: true,
      message: 'Elemento actualizado exitosamente.',
      data: rows[0],
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/items/:id
 * @desc    Eliminar un elemento por su ID
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const itemId = parseInt(id, 10);

    if (isNaN(itemId)) {
      return res.status(400).json({
        success: false,
        error: 'El parámetro "id" debe ser un número entero válido.',
      });
    }

    const deleteQuery = 'DELETE FROM items WHERE id = $1 RETURNING *';
    const { rows } = await db.query(deleteQuery, [itemId]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Elemento con id ${itemId} no encontrado para eliminar.`,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Elemento con id ${itemId} eliminado exitosamente.`,
      deleted: rows[0],
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
