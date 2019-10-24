const dynamoose = require('dynamoose')
dynamoose.local(process.env.DYNAMODB_ENDPOINT)
const UserSchema = new dynamoose.Schema({
	id: {
		type: String, // magic auth0 string
		hashKey: true
	},
	profile: {
		type: String,
		required: true
	},
})

const User = dynamoose.model('User', UserSchema)

const BoardSchema = new dynamoose.Schema({
	id: {
		type: String, // uuidv4
		hashKey: true
	},
	delta: {
		type: String,
		required: true
	},
})

const Board = dynamoose.model('Board', BoardSchema)

module.exports = { User, Board }
