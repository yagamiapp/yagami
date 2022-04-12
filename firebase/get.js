module.exports.get = async (ref, reference) => {
	let data;
	let currentRef = ref;
	for (let i = 0; i < reference.length; i++) {
		currentRef = currentRef.child(reference[i]);
	}

	await currentRef.once("value", (val) => {
		data = val.val();
	});
	return data;
};
