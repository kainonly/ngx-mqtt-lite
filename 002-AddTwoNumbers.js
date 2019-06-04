function ListNode(val) {
    this.val = val;
    this.next = null;
}

/**
 * @param {ListNode} l1
 * @param {ListNode} l2
 * @return {ListNode}
 */
var addTwoNumbers = function (l1, l2) {
    const node = new ListNode();
    let remainder = 0, wait = true, cursor = node;
    while (wait) {
        const n1 = l1 && l1.val ? l1.val : 0;
        const n2 = l2 && l2.val ? l2.val : 0;
        let numbers = n1 + n2 + remainder;
        if (numbers > 9) {
            numbers -= 10;
            remainder = 1;
        } else {
            remainder = 0;
        }
        cursor.val = numbers;
        if ((l1 && l1.next) || (l2 && l2.next) || remainder) {
            l1 = l1 && l1.next ? l1.next : null;
            l2 = l2 && l2.next ? l2.next : null;
            cursor = cursor.next = new ListNode();
        } else {
            wait = false;
        }
    }
    return node;
};


function setListNode(lists) {
    const node = new ListNode(lists.shift());
    let cursor = node;
    while (lists.length !== 0) {
        cursor.next = new ListNode(lists.shift());
        cursor = cursor.next;
    }
    return node;
}

console.log(addTwoNumbers(setListNode([2, 4, 3]), setListNode([5, 6, 4])));
console.log(addTwoNumbers(setListNode([1, 8]), setListNode([0])));
console.log(addTwoNumbers(setListNode([5]), setListNode([5])));
