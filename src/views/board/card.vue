<template lang="pug">
.c-card(@mousedown="onMousedown", :data-card="card._id", :class="{'drag-clone': dragClone, 'drag-shadow': dragShadow}")
	markdown-delta-editor(ref="editor", :ops="card.text", @update="handleDeltaUpdate", @blur="handleBlur")
	.owner
		img(:src="owner.profile.picture", :title="owner.profile.email", draggable="false")
		.name {{ owner.profile.nickname || owner.profile.name }}
</template>
<script>
import MarkdownDeltaEditor from 'components/markdown-delta-editor'
export default {
	props: {
		board: Object,
		card: Object,
		dragShadow: {
			type: Boolean,
			default: false
		},
		dragClone: {
			type: Boolean,
			default: false
		}
	},
	components: { MarkdownDeltaEditor },
	data () {
		return {
		}
	},
	computed: {
		owner () {
			return this.$store.state.users[this.card.owner]
		}
	},
	created () {},
	methods: {
		onMousedown (event) {
			this.$emit('startDragging', event)
		},
		handleDeltaUpdate (delta) {
			this.$store.dispatch('updateCardText', { board: this.board, card: this.card, delta })
		},
		handleBlur () {
			if (this.card.text.length === 0) {
				this.$store.dispatch('deleteCard', { board: this.board, card: this.card })
			}
		},
		focus () {
			this.$refs.editor.focus()
		}
	}
}
</script>
<style lang="stylus">
@import '~variables'

.c-card
	card()
	box-sizing: border-box
	min-height: 128px
	padding: 16px 0 8px 0
	margin: 0px 16px 8px 16px
	cursor: grab
	display: flex
	flex-direction: column
	justify-content: space-between
	&.drag-clone
		pointer-events: none
		position: absolute
		width: 300px - 2 * 16px

	&.drag-shadow
		opacity: 0

	.owner
		display: flex
		align-items: center
		padding: 0 8px
		user-select: none
		img
			height: 28px
			border-radius: 50%
			margin-right: 8px
		.name
			color: $clr-secondary-text-light
			font-size: 12px
</style>
