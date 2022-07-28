const { AuthenticationError } = require('apollo-server-express');
const { User } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = {
    Query: {
        me: async (parent, { username }) => {
            if (context.user) {
                const userData = await User.findOne({ _id: context.user._id })
                    .select('-__v -password')
                    .populate('savedBooks')
                
                return userData;
            }
            throw new AuthenticationError('Not logged in!');
        }
    },
    Mutation: {
        login: async (parent, { username, password }) => {
            const user = await User.findOne({ username });
            const correctPw = await user.isCorrectPassword(password);

            if (!user || !correctPw) {
                throw new AuthenticationError('Username or password is incorrect.');
            }
            
            const token = signToken(user);
            return { token, user };
        },
        addUser: async (parent, args) => {
            const user = await User.create(args);
            const token = signToken(user);

            return { user, token };
        },
        saveBook: async (parent, args, context) => {
            if (context.user) {
                const user = await User.findOneAndUpdate(
                    { _id: context.user._id },
                    { $push: { savedBooks: { bookId: args.bookId } } },
                    { new: true }
                )
                return user;
            }
            throw new AuthenticationError('Must be logged in!');
        },
        removeBook: async (parent, args, context) => {
            if (context.user) {
                const user = await User.findOneAndUpdate(
                    { _id: context.user._id },
                    { $pull: { savedBooks: { bookId: args.bookId } } },
                    { new: true }
                )
                return user;
            }
            throw new AuthenticationError('Must be logged in!');
        }
    }
};

module.exports = resolvers;