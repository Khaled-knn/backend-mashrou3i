const ItemsService = require('../services/itemsService');

const validateUpdateData = (data) => {
  const errors = [];
  if (!data.name) errors.push('Name is required');
  if (!data.price) errors.push('Price is required');
  return errors;
};

const itemsController = {
  async getItems(req, res) {
    try {
      const items = await ItemsService.fetchUserItems(req.userId);
      res.status(200).json({ items });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch items' });
    }
  },

  async deleteItem(req, res) {
    try {
      await ItemsService.deleteItem(req.params.id, req.userId);
      res.status(200).json({ message: 'Item deleted successfully' });
    } catch (error) {
      const status = error.message.includes('not found') ? 404 : 500;
      res.status(status).json({ error: error.message });
    }
  }, 

  async updateItem(req, res) {
    try {
      const errors = validateUpdateData(req.body);
      if (errors.length > 0) {
        return res.status(400).json({ errors });
      }

      const result = await ItemsService.updateItem(
        req.params.id,
        req.userId,
        req.body
      );
      res.status(200).json(result);
    } catch (error) {
      const status = error.message.includes('Cannot edit') ? 403 : 500;
      res.status(status).json({ error: error.message });
    }
  }
};

module.exports = itemsController;