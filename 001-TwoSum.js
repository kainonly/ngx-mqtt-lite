/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
var twoSum = function(nums, target) {
	const map = new Map();
	const len = nums.length;
	for (var i = 0; i < len; i++) {
		const key = target - nums[i];
		if (map.has(key)) return [map.get(key), i];
		map.set(nums[i], i);
	}
};

console.log(twoSum([2, 7, 11, 15], 9));
console.log(twoSum([3, 2, 4], 6));
console.log(twoSum([3, 3], 6));
