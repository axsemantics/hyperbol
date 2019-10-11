<template lang="pug">
.v-board(v-if="board", :class="{dragging: draggingCard}")
	lane(v-for="lane of LANES", :lane="lane", :board="board", @startDragging="startDragging", :draggingCard="draggingCard")
	card(v-if="draggingCard", :card="draggingCard", :board="board", :dragClone="true", :style="dragCloneStyle")
</template>
<script>
import { mapState } from 'vuex'
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
	components: { Card, Lane },
	data () {
		return {
			LANES,
			draggingCard: null,
			draggingOffset: null,
			draggingPosition: null
		}
	},
	computed: {
		...mapState(['boards']),
		board () {
			return this.boards?.test[0].insert // naively unpack root delta
		},
		dragCloneStyle () {
			if (!this.draggingPosition) return
			return {
				top: this.draggingPosition.y - this.draggingOffset.y + 'px',
				left: this.draggingPosition.x - this.draggingOffset.x + 'px'
			}
		}
	},
	created () {},
	mounted () {
		document.addEventListener('mouseup', this.handleMouseup)
		document.addEventListener('mousemove', this.handleMousemove)
	},
	destroyed () {
		document.removeEventListener('mouseup', this.handleMouseup)
		document.removeEventListener('mousemove', this.handleMousemove)
	},
	methods: {
		startDragging ({card, event}) {
			this.draggingCard = Object.assign({}, card)
			this.draggingPosition = {
				x: event.clientX,
				y: event.clientY
			}
			this.draggingOffset = {
				x: event.offsetX,
				y: event.offsetY
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
		}
	}
}
</script>
<style lang="stylus">
@import '~variables'

.v-board
	flex: auto
	display: flex
	justify-content: center
	user-select: none
	min-height: 0
	&.dragging *
		cursor: grabbing !important
</style>
