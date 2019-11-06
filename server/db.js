const dynamoose = require('dynamoose')

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

let User, Board

if (process.env.NODE_ENV !== 'production') {
	console.log('using local database')
	dynamoose.local(process.env.DYNAMODB_ENDPOINT)

	User = dynamoose.model('User', UserSchema)
	Board = dynamoose.model('Board', BoardSchema)
} else {
	console.log('using aws database')
	User = dynamoose.model(process.env.USER_TABLE, UserSchema)
	Board = dynamoose.model(process.env.BOARD_TABLE, BoardSchema)
}

module.exports = { User, Board }
