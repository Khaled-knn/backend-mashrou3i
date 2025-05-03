const db = require('../config/db');

class ItemsService {
  // دالة الجلب الحالية (ننقلها كما هي)
  static async fetchUserItems(creatorId) {
    const [basicItems] = await db.execute(
      'SELECT * FROM items WHERE creator_id = ?',
      [creatorId]
    );

    if (basicItems.length === 0) return [];

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

    return detailedItems;
  }

  // دالة الحذف الجديدة (بدون شرط الوقت)
  static async deleteItem(itemId, creatorId) {
    const connection = await db.getConnection(); // ✅ أخذ اتصال من الـ pool
    try {
      await connection.beginTransaction();
  
      const [item] = await connection.execute(
        'SELECT profession_id FROM items WHERE id = ? AND creator_id = ?',
        [itemId, creatorId]
      );
  
      if (item.length === 0) {
        throw new Error('Item not found or unauthorized');
      }
  
      const professionId = item[0].profession_id;
      const detailTables = {
        1: 'restaurant_item_details',
        2: 'restaurant_item_details',
        5: 'craft_item_details',
        6: 'teaching_item_details'
      };
  
      if (detailTables[professionId]) {
        await connection.execute(
          `DELETE FROM ${detailTables[professionId]} WHERE item_id = ?`,
          [itemId]
        );
      }
  
      await connection.execute('DELETE FROM items WHERE id = ?', [itemId]);
      await connection.commit();
  
      return { success: true };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release(); // 🟢 ضروري ترجع الاتصال للـ pool
    }
  }
  
  // دالة التحقق من الوقت
  static async canEditItem(itemId, creatorId) {
    const [item] = await db.execute(
      'SELECT created_at FROM items WHERE id = ? AND creator_id = ?',
      [itemId, creatorId]
    );

    if (item.length === 0) return false;

    const createdAt = new Date(item[0].created_at);
    const hoursDiff = (Date.now() - createdAt) / (1000 * 60 * 60);
    return hoursDiff <= 24;
  }

  // دالة التعديل
  static async updateItem(itemId, creatorId, updateData) {
    const canEdit = await this.canEditItem(itemId, creatorId);
    if (!canEdit) {
      throw new Error('Cannot edit item after 24 hours');
    }
  
    await db.beginTransaction();
    try {
      // 1. تحديث الجدول الرئيسي
      await db.execute(
        'UPDATE items SET name = ?, price = ?, description = ? WHERE id = ? AND creator_id = ?',
        [updateData.name, updateData.price, updateData.description, itemId, creatorId]
      );
  
      // 2. تحديث الجداول الفرعية حسب النوع
      const [item] = await db.execute(
        'SELECT profession_id FROM items WHERE id = ?',
        [itemId]
      );
  
      const professionId = item[0].profession_id;
      
      if (professionId === 1 || professionId === 2) {
        await db.execute(
          'UPDATE restaurant_item_details SET time = ?, ingredients = ? WHERE item_id = ?',
          [updateData.time, JSON.stringify(updateData.ingredients), itemId]
        );
      } else if (professionId === 3) {
        await db.execute(
          'UPDATE craft_item_details SET working_time = ?, portfolio_links = ? WHERE item_id = ?',
          [updateData.working_time, JSON.stringify(updateData.portfolio_links), itemId]
        );
      } else if (professionId === 4) {
        await db.execute(
          'UPDATE teaching_item_details SET course_duration = ?, syllabus = ? WHERE item_id = ?',
          [updateData.course_duration, updateData.syllabus, itemId]
        );
      }
  
      await db.commit();
      return { success: true, message: 'Item updated successfully' };
    } catch (error) {
      await db.rollback();
      throw error;
    }
  }
}

module.exports = ItemsService;