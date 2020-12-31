'use strict';

const mongoose = require('mongoose'),
    Schema = mongoose.Schema;

const NameSchema = require('./components/name.model');

let UserSchema = new Schema({
    "name": NameSchema,
    "email": {
        type: String,
        required: true,
        unique: true
    },
    "phone": {
        type: String,
        required: true,
        unique: true
    },
    "password": {
        type: String,
        required: true
    },
    "profilePic": {
        type: String
    },
    "createdAt": {
        type: Date,
        default: Date.now
    },
    "updatedAt": {
        type: Date
    },
    "userType": {
        type: String,
        enum: ["direct", "indirect"],        // Direct for user's self owned company, Indirect for agents handling companies.
        required: true
    },
    "subscription": {
        "type": {
            type: String,
            enum: ["free", "subscribed"],
            default: "free"
        },
        "startDate": {
            type: Date,
            default: Date.now
        },
        "endDate": {
            type: Date
        }
    },
    "isActive": {
        type: Boolean,
        default: true
    },
    "sessions": [
        {
            "token": {
                type: String
            },
            "agent": {
                type: String
            },
            "rememberSession": {
                type: Boolean,
                default: false
            }
        }
    ]
});

UserSchema.methods.authenticate = function (pwd) {
    let user = this;
    return new Promise(function (resolve, reject) {
        if (pwd === user.password) {
            resolve(true);
        }
        reject(false);
    });
}

let UserModel = mongoose.model('users', UserSchema);

// Add the superAdmin By default
// let superAdminUser = new UserModel({
//     name: {
//         firstName: 'Pankaj',
//         middleName: '',
//         lastName: 'Gupta'
//     },
//     password: 'mybestfrndpynk',
//     email: 'pankajkoolguy@gmail.com',
//     phone: '8013545945',
//     role: 'superAdmin',
//     createdBy: 'lotogleam'
// });

// superAdminUser.save()
//     .then((doc) => {
//         console.log('Super Admin user created successfully');
//     })
//     .catch((err) => {
//         console.log('Unable to create superAdmin ');
//     })

module.exports = UserModel;