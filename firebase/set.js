module.exports.set = async (ref, data, reference) => {
	let currentRef = ref;
	for (let i = 0; i < reference.length; i++) {
		currentRef = currentRef.child(reference[i]);
	}

	currentRef.set(data);
};
