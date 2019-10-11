<template lang="pug">
.c-lane(:data-lane="lane")
	.lane-header {{ lane }}
		bunt-button(@click="addCard") add card
	transition-group.cards(name="cards", tag="div", v-scrollbar.y="")
		card(v-for="(card, index) of cards", :class="{first: index === 0}", :key="card._id", :card="card", :board="board", @startDragging="$emit('startDragging', {card, event: $event})", :dragShadow="draggingCard && card._id === draggingCard._id", ref="cards")
</template>
<script>
import Big from 'big.js'
import Card from './card'
export default {
	props: {
		lane: String,
		board: Object,
		draggingCard: Object
	},
	components: { Card },
	data () {
		return {
		}
	},
	computed: {
		cards () {
			const cards = Object.values(this.board.cards).filter(card => card.lane === this.lane && card._id !== this.draggingCard?._id)
			if (this.draggingCard && this.draggingCard.lane === this.lane) {
				cards.push(this.draggingCard)
			}
			return cards.sort((a, b) => Number(new Big(a.order).minus(b.order).toString()))
		}
	},
	created () {},
	mounted () {
		this.$nextTick(() => {
		})
	},
	methods: {
		addCard () {
			this.$store.dispatch('addCard', {
				board: this.board,
				lane: this.lane,
				order: this.cards[0]?.order ? new Big(this.cards[0]?.order).minus(1).toString() : '0'
			}).then(id => {
				this.$nextTick(() => {
					const el = this.$refs.cards.find(el => el.card._id === id)
					if (el) el.focus()
				})
			})
		}
	}
}
</script>
<style lang="stylus">
@import '~variables'

.c-lane
	width: 300px
	padding-top: 32px
	display: flex
	flex-direction: column
	.lane-header
		text-transform: uppercase
		color: $clr-secondary-text-light
		font-size: 18px
		display: flex
		justify-content: space-between
		align-items: center
		margin: 0 16px
	&:not(:last-child)
		border-right: border-separator()
	.bunt-button
		button-style(style: clear)
	.cards
		flex: auto
		min-height: 0
		display: flex
		flex-direction: column
		> .first
			margin-top: 16px
	.cards-enter-active, .cards-leave-active
		transition: all .3s
	.cards-enter, .cards-leave-to
		opacity: 0
	.cards-move
		transition: transform .2s
</style>
