const db = require('../config/db');

const addItem = async (req, res) => {
  try {
    const creatorId = req.userId;

    const [creatorRows] = await db.execute(
      'SELECT profession_id, tokens FROM creators WHERE id = ?',
      [creatorId]
    );

    if (creatorRows.length === 0) {
      return res.status(404).json({ error: 'Creator not found' });
    }

    const creator = creatorRows[0];
    const professionId = creator.profession_id;
    const currentTokens = creator.tokens;

    if (currentTokens < 5) {
      return res.status(400).json({ error: 'Insufficient tokens to add item' });
    }
    const {
      name,
      price,
      pictures,
      description,
      category_id,
      time,
      ingredients,
      working_time,
      behance_link,
      portfolio_links,
      course_duration,
      syllabus,
    } = req.body;

    const itemPictures = pictures !== undefined ? JSON.stringify(pictures) : null;
    const itemDescription = description !== undefined ? description : null;

    const [itemResult] = await db.execute(
      'INSERT INTO items (creator_id, category_id, name, price, pictures, description, profession_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [creatorId, category_id, name, price, itemPictures, itemDescription, professionId]
    );
    const itemId = itemResult.insertId;

    let detailsTable;
    let query;
    let values;

    if (professionId === 1 || professionId === 2) {
      detailsTable = 'restaurant_item_details';
      query = `INSERT INTO ${detailsTable} (item_id`;
      values = [itemId];

      if (time !== undefined) {
        query += `, time`;
        values.push(time);
      }
      if (ingredients !== undefined) {
        query += `, ingredients`;
        values.push(JSON.stringify(ingredients));
      }
    } else if (professionId === 3) {
      detailsTable = 'craft_item_details';
      query = `INSERT INTO ${detailsTable} (item_id`;
      values = [itemId];

      if (working_time !== undefined) {
        query += `, working_time`;
        values.push(working_time);
      }
      if (behance_link !== undefined) {
        query += `, behance_link`;
        values.push(behance_link);
      }
      if (portfolio_links !== undefined) {
        query += `, portfolio_links`;
        values.push(JSON.stringify(portfolio_links));
      }
    } else if (professionId === 4) {
      detailsTable = 'teaching_item_details';
      query = `INSERT INTO ${detailsTable} (item_id`;
      values = [itemId];

      if (course_duration !== undefined) {
        query += `, course_duration`;
        values.push(course_duration);
      }
      if (syllabus !== undefined) {
        query += `, syllabus`;
        values.push(syllabus);
      }
    }

    if (query && values.length > 1) {
      query += `) VALUES (?${', ?'.repeat(values.length - 1)})`;
      console.log('استعلام SQL لجدول التفاصيل:', query);
      console.log('قيم استعلام جدول التفاصيل:', values);
      await db.execute(query, values);
    }

    await db.execute('UPDATE creators SET tokens = ? WHERE id = ?', [
      currentTokens - 5,
      creatorId,
    ]);

    res.status(201).json({ message: 'Item added successfully', itemId });

  } catch (error) {
    console.error('Error adding item:', error);
    res.status(500).json({ error: 'Server error while adding item' });
  }
};

module.exports = { addItem };
