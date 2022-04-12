module.exports.push = async (ref, data, reference) => {
	let oldData;
	let currentRef = ref;

	for (let i = 0; i < reference.length; i++) {
		currentRef = currentRef.child(reference[i]);
	}

	await currentRef.once("value", (val) => {
		oldData = val.val();
	});

	if (oldData == null) {
		currentRef.set([data]);
		return;
	}

	oldData.push(data);
	currentRef.set(oldData);
};
