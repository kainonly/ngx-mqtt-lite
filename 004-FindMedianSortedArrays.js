/**
 * @param {number[]} nums1
 * @param {number[]} nums2
 * @return {number}
 */
var findMedianSortedArrays = function(nums1, nums2) {
	const list = nums1.concat(nums2).sort((a, b) => a > b ? 1 : -1);
	const len = list.length;
	if (len % 2 !== 0) {
		return list[(list.length - 1) / 2];
	} else {
		const half = list.length / 2;
		return (list[half - 1] + list[half]) / 2;
	}
};

console.log(findMedianSortedArrays(
	[1, 3],
	[2]),
);
console.log(findMedianSortedArrays(
	[1, 2],
	[3, 4],
));
console.log(findMedianSortedArrays(
	[3],
	[-2, -1],
));
console.log(findMedianSortedArrays(
	[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 4, 4],
	[1, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4],
));
