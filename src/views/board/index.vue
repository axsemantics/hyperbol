<template lang="pug">
.v-board(v-if="board", :class="{dragging: draggingCard, 'running-standup': standup}")
	.board-header
		input.name(type="text", :value="board.name", @input="changeBoardName")
		.right
			.users
				bunt-button#btn-join-board(v-if="!hasJoinedBoard", @click="joinBoard") join
				.user(v-for="user of users")
					img(:src="user.profile.picture", :title="user.profile.email", draggable="false")
			bunt-button#btn-start-standup(v-if="!standup", @click="startStandup") start stand-up
	.standup-join(v-if="standup && standup.stage.name === 'join'")
		h1 Get ready!
		.participants
			.participant(v-for="participant of participants", :class="{joined: participant.joined, focused: participant.user.id === focusedParticipant}", @click="joinStandup(participant.user.id, !participant.joined)")
				.participant-inner
					img(:src="participant.user.profile.picture", :title="participant.user.profile.email", draggable="false")
		bunt-button#btn-join-standup(v-if="ownStandupParticipant && !ownStandupParticipant.joined", @click="joinStandup(userId, true)") Join
		bunt-button#btn-begin-standup(v-else, @click="beginStandup") Begin!
	.lanes(v-else)
		lane(v-for="lane of LANES", :lane="lane", :board="board", @startDragging="startDragging", :draggingCard="draggingCard")
	.standup-control(v-if="standup")
	card(v-if="draggingCard", :card="draggingCard", :board="board", :dragClone="true", :style="dragCloneStyle")
</template>
<script>
import { mapState, mapGetters } from 'vuex'
import Big from 'big.js'
import Card from './card'
import Lane from './lane'

const LANES = [
	'future',
	'stuck',
	'active',
	'done'
]
export default {
	name: 'Board',
	components: { Card, Lane },
	data () {
		return {
			LANES,
			draggingCard: null,
			draggingOffset: null,
			draggingPosition: null,
			focusedParticipant: null
		}
	},
	computed: {
		...mapState(['boards', 'standups']),
		...mapGetters(['userId']),
		board () {
			return this.boards?.[this.$route.params.boardId]?.[0].insert // naively unpack root delta
		},
		standup () {
			return this.standups?.[this.$route.params.boardId]
		},
		dragCloneStyle () {
			if (!this.draggingPosition) return
			return {
				top: this.draggingPosition.y - this.draggingOffset.y + 'px',
				left: this.draggingPosition.x - this.draggingOffset.x - 16 + 'px'
			}
		},
		hasJoinedBoard () {
			return this.board.users.includes(this.userId)
		},
		users () {
			return this.board.users.map(userId => this.$store.state.users[userId])
		},
		participants () {
			return this.standup?.participants.map(({user, joined}) => ({user: this.$store.state.users[user], joined}))
		},
		ownStandupParticipant () {
			return this.standup?.participants.find(({user}) => user === this.userId)
		}
	},
	created () {},
	mounted () {
		document.addEventListener('mouseup', this.handleMouseup)
		document.addEventListener('mousemove', this.handleMousemove)
		document.addEventListener('keydown', this.handleKeydown)
	},
	destroyed () {
		document.removeEventListener('mouseup', this.handleMouseup)
		document.removeEventListener('mousemove', this.handleMousemove)
		document.removeEventListener('keydown', this.handleKeydown)
	},
	methods: {
		changeBoardName (event) {
			this.$store.dispatch('updateBoard', {board: this.board, update: {name: event.target.value}})
		},
		joinBoard () {
			this.$store.dispatch('joinBoard', {board: this.board})
		},
		async startStandup () {
			await this.$store.dispatch('startStandup', {board: this.board})
			this.focusedParticipant = this.standup?.participants[0].user
		},
		joinStandup (user, join) {
			this.$store.dispatch('joinStandup', {board: this.board, user, join})
		},
		abortStandup () {
			this.$store.dispatch('abortStandup', {board: this.board})
		},
		beginStandup () {
			this.$store.dispatch('beginStandup', {board: this.board})
		},
		startDragging ({card, event}) {
			this.draggingCard = Object.assign({}, card)
			this.draggingPosition = {
				x: event.clientX,
				y: event.clientY
			}
			const cardEl = event.target.closest('.c-card')
			const cardElRect = cardEl.getBoundingClientRect()
			this.draggingOffset = {
				x: event.clientX - cardElRect.x,
				y: event.clientY - cardElRect.y
			}
		},
		handleMouseup () {
			if (!this.draggingCard) return
			this.$store.dispatch('updateCard', {
				board: this.board,
				card: this.draggingCard,
				update: {
					lane: this.draggingCard.lane,
					order: this.draggingCard.order
				}
			})
			this.draggingCard = null
			this.draggingPosition = null
		},
		handleMousemove (event) {
			if (!this.draggingCard) return
			this.draggingPosition = {
				x: event.clientX,
				y: event.clientY
			}
			// find card and lane
			let lane
			let card
			let target = event.target
			let cardRect
			if (target.classList.contains('cards')) {
				// try compensating for gutter
				target = document.elementFromPoint(event.clientX, event.clientY - 10)
			}
			while (!(lane && card) && target && target !== this.$el) {
				if (target.dataset.lane) {
					lane = target.dataset.lane
				}
				if (target.dataset.card) {
					card = this.board.cards[target.dataset.card]
					cardRect = target.getBoundingClientRect()
				}
				target = target.parentElement
			}
			if (!lane || (card && card._id === this.draggingCard._id)) return
			if (lane !== this.draggingCard.lane) this.draggingCard.lane = lane
			// TODO less copypasta
			const cards = Object.values(this.board.cards).filter(card => card.lane === lane && card._id !== this.draggingCard._id)

			cards.push(this.draggingCard)
			cards.sort((a, b) => Number(new Big(a.order).minus(b.order).toString()))
			if (!card) {
				if (cards.length === 0) { // empty lane
					this.draggingCard.order = '0'
				} else if (event.offsetY < 36) { // start of lane
					const card = cards[0]
					if (card === this.draggingCard) return
					this.draggingCard.order = new Big(card.order).minus(1).toString()
				} else { // end of lane
					const card = cards[cards.length - 1]
					if (card === this.draggingCard) return
					this.draggingCard.order = new Big(card.order).plus(1).toString()
				}
			} else {
				const index = cards.indexOf(card)
				const currentCardOrder = new Big(card.order)
				if (event.clientY - cardRect.y < cardRect.height / 2) {
					if (cards[index - 1] === this.draggingCard) return
					if (index === 0) { // first card
						this.draggingCard.order = currentCardOrder.minus(1).toString()
					} else {
						this.draggingCard.order = currentCardOrder.minus(currentCardOrder.minus(cards[index - 1].order).div(2)).toString()
					}
				} else {
					if (cards[index + 1] === this.draggingCard) return
					if (index === cards.length - 1) { // last card
						this.draggingCard.order = currentCardOrder.plus(1).toString()
					} else {
						this.draggingCard.order = currentCardOrder.plus(new Big(cards[index + 1].order).minus(currentCardOrder).div(2)).toString()
					}
				}
			}
		},
		handleKeydown (event) {
			console.log(event)
			const changeFocusedParticipant = (mod) => {
				if (!this.focusedParticipant) {
					this.focusedParticipant = this.standup.participants[0].user
				} else {
					let index = this.standup.participants.findIndex(({user}) => user === this.focusedParticipant)
					index += mod
					index = Math.max(0, Math.min(index, this.standup.participants.length - 1))
					this.focusedParticipant = this.standup.participants[index].user
				}
			}
			if (this.standup?.stage.name === 'join') {
				switch (event.key) {
					case 'ArrowLeft': {
						changeFocusedParticipant(-1)
						break
					}
					case 'ArrowRight': {
						changeFocusedParticipant(1)
						break
					}
					case 'ArrowUp': {
						this.$store.dispatch('joinStandup', {
							board: this.board,
							user: this.focusedParticipant,
							join: true
						})
						changeFocusedParticipant(1)
						break
					}
					case 'ArrowDown': {
						this.$store.dispatch('joinStandup', {
							board: this.board,
							user: this.focusedParticipant,
							join: false
						})
						changeFocusedParticipant(1)
						break
					}
				}
			}
		}
	}
}
</script>
<style lang="stylus">
@import '~variables'

.v-board
	flex: auto
	display: flex
	flex-direction: column
	min-height: 0
	.board-header
		height: 64px
		flex: none
		background-color: $clr-white
		border-bottom: border-separator()
		display: flex
		align-items: center
		justify-content: space-between
		padding: 0 16px
		.name
			font-size: 18px
			border: none
			outline: none
		.right
			display: flex
			align-items: center
		.users
			display: flex
			align-items: center
			#btn-join-board
				button-style(style: 'clear', color: $clr-primary)
			.user
				display: flex
				img
					height: 52px
					border-radius: 50%
					border: 2px solid $clr-white
				&:not(:first-child)
					margin-left: -16px
		#btn-start-standup
			button-style(color: $clr-primary)
			margin-left: 8px
	.lanes
		flex: auto
		display: flex
		justify-content: center
		user-select: none
		min-height: 0
	&.dragging *
		cursor: grabbing !important

	// standup stuff
	.standup-join
		display: flex
		flex-direction: column
		align-items: center

		.participants
			display: flex
			user-select: none
			.participant
				cursor: pointer
				position: relative
				.participant-inner
					border-radius: 50%
					height: 120px
					width: @height
					box-sizing: border-box
				img
					height: 100%
					border-radius: 50%
				&:not(:last-child)
					margin-right: 8px
				&:not(.joined)
					.participant-inner
						border: 6px solid $clr-danger
					img
						opacity: .6
					&::after
						content: ''
						display: block
						background-color: $clr-danger
						width: calc(100% - 4px)
						height: 6px
						position: absolute
						top: calc(50% - 4px)
						transform: rotate(45deg)
				&.joined
					.participant-inner
						border: 6px solid $clr-primary
				&.focused::before
					content: ''
					display: block
					height: 6px
					width: 100%
					position: absolute
					bottom: -8px
					background-color: $clr-secondary-text-light
		#btn-join-standup, #btn-begin-standup
			button-style(color: $clr-primary, size: large)
			margin-top: 32px
</style>
