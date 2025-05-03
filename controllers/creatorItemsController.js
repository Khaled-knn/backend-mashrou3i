const db = require('../config/db');

const fetchMyItems = async (req, res) => {
  try {
    const creatorId = req.user.id;

    const [basicItems] = await db.execute(
      'SELECT * FROM items WHERE creator_id = ?',
      [creatorId]
    );

    if (basicItems.length === 0) {
      return res.status(200).json({ items: [] });
    }

    const detailedItems = await Promise.all(
      basicItems.map(async (item) => {
        let details = {};

        switch (item.profession_id) {
          case 1:
          case 2:
            [details] = await db.execute(
              'SELECT time, ingredients FROM restaurant_item_details WHERE item_id = ?',
              [item.id]
            );
            break;
          case 3:
            [details] = await db.execute(
              'SELECT working_time, behance_link, portfolio_links FROM craft_item_details WHERE item_id = ?',
              [item.id]
            );
            break;
          case 4:
            [details] = await db.execute(
              'SELECT course_duration, syllabus FROM teaching_item_details WHERE item_id = ?',
              [item.id]
            );
            break;
        }

        const itemDetails = details[0] || null;

        // 🔄 تحويل ingredients من string إلى JSON
        if (
          (item.profession_id === 1 || item.profession_id === 2) &&
          itemDetails?.ingredients
        ) {
          try {
            itemDetails.ingredients = JSON.parse(itemDetails.ingredients);
          } catch (e) {
            console.error('فشل في تحويل ingredients:', e);
          }
        }

        // 🔄 تحويل pictures من JSON string إلى Array
        if (item.pictures) {
          try {
            item.pictures = JSON.parse(item.pictures);
          } catch (e) {
            console.error('فشل في تحويل pictures:', e);
          }
        }

        return {
          ...item,
          details: itemDetails,
        };
      })
    );

    res.status(200).json({ items: detailedItems });
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'خطأ أثناء جلب العناصر' });
  }
};

module.exports = { fetchMyItems };
