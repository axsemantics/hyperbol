<template lang="pug">
.v-board(v-if="board")
	lane(v-for="lane of LANES", :lane="lane", :board="board")
</template>
<script>
import { mapState } from 'vuex'
import Lane from './lane'

const LANES = [
	'future',
	'stuck',
	'active',
	'done'
]
export default {
	components: { Lane },
	data () {
		return {
			LANES
		}
	},
	computed: {
		...mapState(['boards']),
		board () {
			return this.boards?.test[0].insert // naively unpack root delta
		}
	},
	created () {},
	mounted () {
		this.$nextTick(() => {
		})
	},
	methods: {
	}
}
</script>
<style lang="stylus">
@import '~variables'

.v-board
	flex: auto
	display: flex
	justify-content: center
</style>
