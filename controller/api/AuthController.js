'use strict';

const { sequelize } = require('../../db/dbSchema');
const { API_Users } = sequelize.models;


class AuthController {

    // OnCreate : 
    //  If already exist
    //      res.status(403).json({ message: "User already registered" });
    //  If error occured encrypt
    //      res.status(400).json({ 'error': err });
    //  If Global error (catch)
    //      res.status(500).json({ 'error': err });
    static async createOrLoadUser(username, email, decryptedPassword, createUserIfNotExist) {
        try {
            const data = {
                isNew: false,
                user: await API_Users.findOne({ where: { username: username, email: email } }),
                jwtUser: {}
            }

            if (createUserIfNotExist && data.user == null) {
                data.isNew = true;

                data.user = await API_Users.create({
                    username: username,
                    password: decryptedPassword,
                    email: email,
                });

            } else if (data.user) {
                // payload
                data.jwtUser = {
                    id: data.user.id,
                    username: data.user.username,
                    email: data.user.email,
                }
            }

            return data;

        } catch (error) {
            if (error.name === 'SequelizeUniqueConstraintError') {
                return console.error('That Users already exists.', error);
            }
            return console.error('A error occured in AuthController.createOrLoadUser.', error);
        }
    }

    static async getUser(payload) {
        try {
            return await API_Users.findOne({ where: { id: payload.id, username: payload.username, email: payload.email } });
        } catch (error) {
            return console.error('A error occured in AuthController.getUser.', error);
        }
    }
}

module.exports = {
    AuthController,
};