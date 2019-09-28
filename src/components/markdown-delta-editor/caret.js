export default {
	props: {
		isFocused: Boolean,
		selectionPositions: Object
	},
	name: 'delta-editor--caret',
	watch: {
		selectionPositions: {
			handler () {
				this.animation.cancel()
				clearTimeout(this.animationPause)
				this.animationPause = setTimeout(() => this.animation.play(), 200)
			},
			deep: true
		}
	},
	render (createElement) {
		return createElement('div', {
			class: {
				caret: true,
				visible: this.isFocused && this.selectionPositions?.focus !== null
			},
			style: {
				left: this.selectionPositions?.focus + 'px',
				top: this.selectionPositions?.top + 'px'
			}
		})
	},
	mounted () {
		this.animation = this.$el.animate([
			{opacity: 1},
			{offset: 0.2, opacity: 1},
			{offset: 0.6, opacity: 0},
			{opacity: 0}
		], {
			duration: 500,
			iterations: Infinity,
			direction: 'alternate',
			easing: 'ease-in-out'
		})
	}
}
