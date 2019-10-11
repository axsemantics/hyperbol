const dynamoose = require('dynamoose')
dynamoose.local(process.env.DYNAMODB_ENDPOINT)
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

module.exports = { Board }
