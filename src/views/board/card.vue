<template lang="pug">
.c-card
	markdown-delta-editor(:ops="card.text", @update="handleDeltaUpdate")
</template>
<script>
import MarkdownDeltaEditor from 'components/markdown-delta-editor'
export default {
	props: {
		board: Object,
		card: Object
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
		}
	}
}
</script>
<style lang="stylus">
@import '~variables'

.c-card
	card()
	min-height: 200px
	margin-bottom: 8px
</style>
