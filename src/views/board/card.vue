<template lang="pug">
.c-card(@mousedown="onMousedown", :data-card="card._id", :class="{'drag-clone': dragClone, 'drag-shadow': dragShadow}")
	markdown-delta-editor(:ops="card.text", @update="handleDeltaUpdate")
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
		handleDeltaUpdate (delta) {
			this.$store.dispatch('updateCardText', { board: this.board, card: this.card, delta })
		},
		onMousedown (event) {
			this.$emit('startDragging', event)
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
	margin-bottom: 8px
	cursor: grab

	&.drag-clone
		pointer-events: none
		position: absolute
		width: 300px - 2 * 16px

	&.drag-shadow
		opacity: 0
</style>
