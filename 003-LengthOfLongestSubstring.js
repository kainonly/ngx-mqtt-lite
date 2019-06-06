/**
 * @param {string} s
 * @return {number}
 */
var lengthOfLongestSubstring = function(s) {
	if (!s) return 0;
	const len = s.length;
	let left = 0, max = 0;
	for (let right = 0; right < len; right++) {
		const char = s[right];
		const index = s.slice(left, right).indexOf(char);
		if (index === -1) {
			max = Math.max(max, right - left + 1);
		} else {
			left += index + 1;
		}
	}
	return max;
};

console.log(lengthOfLongestSubstring('abcabcbb'));
console.log(lengthOfLongestSubstring('bbbbb'));
console.log(lengthOfLongestSubstring('pwwkew'));
console.log(lengthOfLongestSubstring(''));
console.log(lengthOfLongestSubstring('au'));
console.log(lengthOfLongestSubstring('aab'));
console.log(lengthOfLongestSubstring('bbtablud'));
