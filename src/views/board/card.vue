<template lang="pug">
.c-card(@mousedown="onMousedown", :data-card="card._id", :class="{'drag-clone': dragClone, 'drag-shadow': dragShadow}")
	markdown-delta-editor(ref="editor", :ops="card.text", @update="handleDeltaUpdate", @blur="handleBlur")
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
	computed: {},
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
	min-height: 100px
	padding: 16px 0
	margin: 0px 16px 8px 16px
	cursor: grab

	&.drag-clone
		pointer-events: none
		position: absolute
		width: 300px - 2 * 16px

	&.drag-shadow
		opacity: 0
</style>
