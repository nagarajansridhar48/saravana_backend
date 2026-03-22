const mongoose = require('mongoose');
const createSchema = require('../persistence/createSchema');
const {schemaFields} = require('./payload');

const schema = createSchema(schemaFields);

const adminModel = mongoose.model('admin',schema);

module.exports = {
    adminModel
};