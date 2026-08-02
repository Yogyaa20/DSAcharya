"""
Seed the database with common DSA problems across all topics
"""
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
from models import Problem
import uuid

# Create tables
Base.metadata.create_all(bind=engine)

def seed_problems():
    db = SessionLocal()
    
    problems = [
        # Arrays - Easy
        {"title": "Two Sum", "difficulty": "easy", "topic": "arrays", 
         "description": "Find two numbers that add up to target", 
         "solution_link": "https://leetcode.com/problems/two-sum/"},
        {"title": "Best Time to Buy and Sell Stock", "difficulty": "easy", "topic": "arrays",
         "description": "Find maximum profit from stock prices",
         "solution_link": "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/"},
        {"title": "Contains Duplicate", "difficulty": "easy", "topic": "arrays",
         "description": "Check if array contains duplicates",
         "solution_link": "https://leetcode.com/problems/contains-duplicate/"},
        
        # Arrays - Medium
        {"title": "3Sum", "difficulty": "medium", "topic": "arrays",
         "description": "Find all triplets that sum to zero",
         "solution_link": "https://leetcode.com/problems/3sum/"},
        {"title": "Container With Most Water", "difficulty": "medium", "topic": "arrays",
         "description": "Find container that can store most water",
         "solution_link": "https://leetcode.com/problems/container-with-most-water/"},
        
        # Strings - Easy
        {"title": "Valid Palindrome", "difficulty": "easy", "topic": "strings",
         "description": "Check if string is a palindrome",
         "solution_link": "https://leetcode.com/problems/valid-palindrome/"},
        {"title": "Valid Anagram", "difficulty": "easy", "topic": "strings",
         "description": "Check if two strings are anagrams",
         "solution_link": "https://leetcode.com/problems/valid-anagram/"},
        
        # Strings - Medium
        {"title": "Longest Substring Without Repeating Characters", "difficulty": "medium", "topic": "strings",
         "description": "Find length of longest substring without repeating chars",
         "solution_link": "https://leetcode.com/problems/longest-substring-without-repeating-characters/"},
        {"title": "Group Anagrams", "difficulty": "medium", "topic": "strings",
         "description": "Group strings that are anagrams",
         "solution_link": "https://leetcode.com/problems/group-anagrams/"},
        
        # Linked Lists - Easy
        {"title": "Reverse Linked List", "difficulty": "easy", "topic": "linked-lists",
         "description": "Reverse a singly linked list",
         "solution_link": "https://leetcode.com/problems/reverse-linked-list/"},
        {"title": "Merge Two Sorted Lists", "difficulty": "easy", "topic": "linked-lists",
         "description": "Merge two sorted linked lists",
         "solution_link": "https://leetcode.com/problems/merge-two-sorted-lists/"},
        
        # Trees - Easy
        {"title": "Maximum Depth of Binary Tree", "difficulty": "easy", "topic": "trees",
         "description": "Find maximum depth of binary tree",
         "solution_link": "https://leetcode.com/problems/maximum-depth-of-binary-tree/"},
        {"title": "Same Tree", "difficulty": "easy", "topic": "trees",
         "description": "Check if two trees are identical",
         "solution_link": "https://leetcode.com/problems/same-tree/"},
        
        # Trees - Medium
        {"title": "Binary Tree Level Order Traversal", "difficulty": "medium", "topic": "trees",
         "description": "Traverse tree level by level",
         "solution_link": "https://leetcode.com/problems/binary-tree-level-order-traversal/"},
        {"title": "Validate Binary Search Tree", "difficulty": "medium", "topic": "trees",
         "description": "Check if tree is valid BST",
         "solution_link": "https://leetcode.com/problems/validate-binary-search-tree/"},
        
        # Dynamic Programming - Easy
        {"title": "Climbing Stairs", "difficulty": "easy", "topic": "dynamic-programming",
         "description": "Count ways to climb n stairs",
         "solution_link": "https://leetcode.com/problems/climbing-stairs/"},
        
        # Dynamic Programming - Medium
        {"title": "Coin Change", "difficulty": "medium", "topic": "dynamic-programming",
         "description": "Find minimum coins needed for amount",
         "solution_link": "https://leetcode.com/problems/coin-change/"},
        {"title": "Longest Increasing Subsequence", "difficulty": "medium", "topic": "dynamic-programming",
         "description": "Find length of longest increasing subsequence",
         "solution_link": "https://leetcode.com/problems/longest-increasing-subsequence/"},
        
        # Graphs - Medium
        {"title": "Number of Islands", "difficulty": "medium", "topic": "graphs",
         "description": "Count number of islands in grid",
         "solution_link": "https://leetcode.com/problems/number-of-islands/"},
        {"title": "Clone Graph", "difficulty": "medium", "topic": "graphs",
         "description": "Deep copy a graph",
         "solution_link": "https://leetcode.com/problems/clone-graph/"},
        
        # Graphs - Hard
        {"title": "Word Ladder", "difficulty": "hard", "topic": "graphs",
         "description": "Find shortest transformation sequence",
         "solution_link": "https://leetcode.com/problems/word-ladder/"},
        
        # Binary Search - Medium
        {"title": "Search in Rotated Sorted Array", "difficulty": "medium", "topic": "binary-search",
         "description": "Search in rotated sorted array",
         "solution_link": "https://leetcode.com/problems/search-in-rotated-sorted-array/"},
        
        # Backtracking - Medium
        {"title": "Subsets", "difficulty": "medium", "topic": "backtracking",
         "description": "Generate all possible subsets",
         "solution_link": "https://leetcode.com/problems/subsets/"},
        {"title": "Permutations", "difficulty": "medium", "topic": "backtracking",
         "description": "Generate all permutations",
         "solution_link": "https://leetcode.com/problems/permutations/"},

        # ─────────────────────────────────────────────
        # NEW TOPICS
        # ─────────────────────────────────────────────

        # 1. basic-syntax
        {"title": "Reverse a String", "difficulty": "easy", "topic": "basic-syntax",
         "description": "Reverse a given string",
         "solution_link": "https://leetcode.com/problems/reverse-string/"},
        {"title": "Check Palindrome", "difficulty": "easy", "topic": "basic-syntax",
         "description": "Check if string is a palindrome",
         "solution_link": "https://www.geeksforgeeks.org/problems/palindrome-string0817/"},
        {"title": "Count Vowels in String", "difficulty": "easy", "topic": "basic-syntax",
         "description": "Count number of vowels in string",
         "solution_link": "https://www.hackerrank.com/challenges/counting-valleys/problem"},
        {"title": "FizzBuzz", "difficulty": "easy", "topic": "basic-syntax",
         "description": "Output Fizz for multiples of 3, Buzz for 5",
         "solution_link": "https://leetcode.com/problems/fizz-buzz/"},
        {"title": "Sum of Digits", "difficulty": "easy", "topic": "basic-syntax",
         "description": "Find sum of digits of a number",
         "solution_link": "https://www.geeksforgeeks.org/problems/sum-of-digits1742/"},

        # 2. time-space-complexity
        {"title": "Find Maximum in Array", "difficulty": "easy", "topic": "time-space-complexity",
         "description": "Find the maximum element in an array",
         "solution_link": "https://leetcode.com/problems/find-the-highest-altitude/"},
        {"title": "Two Sum", "difficulty": "easy", "topic": "time-space-complexity",
         "description": "Find two numbers that add to target",
         "solution_link": "https://leetcode.com/problems/two-sum/"},
        {"title": "Contains Duplicate", "difficulty": "easy", "topic": "time-space-complexity",
         "description": "Check if array contains duplicate values",
         "solution_link": "https://leetcode.com/problems/contains-duplicate/"},
        {"title": "Missing Number", "difficulty": "easy", "topic": "time-space-complexity",
         "description": "Find missing number in array range 0..n",
         "solution_link": "https://leetcode.com/problems/missing-number/"},
        {"title": "Single Number", "difficulty": "easy", "topic": "time-space-complexity",
         "description": "Find element that appears once",
         "solution_link": "https://leetcode.com/problems/single-number/"},
        {"title": "Best Time to Buy Stock", "difficulty": "easy", "topic": "time-space-complexity",
         "description": "Find max profit from buying and selling stock",
         "solution_link": "https://www.geeksforgeeks.org/problems/stock-buy-and-sell-1587115621/"},

        # 3. sorting
        {"title": "Sort Colors", "difficulty": "medium", "topic": "sorting",
         "description": "Sort array with 0s, 1s, and 2s in-place",
         "solution_link": "https://leetcode.com/problems/sort-colors/"},
        {"title": "Merge Sorted Array", "difficulty": "easy", "topic": "sorting",
         "description": "Merge two sorted arrays",
         "solution_link": "https://leetcode.com/problems/merge-sorted-array/"},
        {"title": "Kth Largest Element", "difficulty": "medium", "topic": "sorting",
         "description": "Find kth largest element in unsorted array",
         "solution_link": "https://leetcode.com/problems/kth-largest-element-in-an-array/"},
        {"title": "Bubble Sort", "difficulty": "easy", "topic": "sorting",
         "description": "Implement bubble sort algorithm",
         "solution_link": "https://www.geeksforgeeks.org/problems/bubble-sort/"},
        {"title": "Insertion Sort", "difficulty": "easy", "topic": "sorting",
         "description": "Implement insertion sort algorithm",
         "solution_link": "https://www.geeksforgeeks.org/problems/insertion-sort/"},
        {"title": "Quick Sort", "difficulty": "medium", "topic": "sorting",
         "description": "Implement quick sort using partition",
         "solution_link": "https://www.geeksforgeeks.org/problems/quick-sort/"},
        {"title": "Merge Sort", "difficulty": "medium", "topic": "sorting",
         "description": "Implement divide-and-conquer merge sort",
         "solution_link": "https://www.geeksforgeeks.org/problems/merge-sort/"},
        {"title": "Sort an Array", "difficulty": "medium", "topic": "sorting",
         "description": "Sort array in ascending order",
         "solution_link": "https://leetcode.com/problems/sort-an-array/"},

        # 4. recursion
        {"title": "Fibonacci Number", "difficulty": "easy", "topic": "recursion",
         "description": "Compute the nth Fibonacci number recursively",
         "solution_link": "https://leetcode.com/problems/fibonacci-number/"},
        {"title": "Climbing Stairs", "difficulty": "easy", "topic": "recursion",
         "description": "Find distinct ways to climb n stairs",
         "solution_link": "https://leetcode.com/problems/climbing-stairs/"},
        {"title": "Pow(x,n)", "difficulty": "medium", "topic": "recursion",
         "description": "Calculate x raised to power n recursively",
         "solution_link": "https://leetcode.com/problems/powx-n/"},
        {"title": "Tower of Hanoi", "difficulty": "medium", "topic": "recursion",
         "description": "Solve famous Tower of Hanoi puzzle",
         "solution_link": "https://www.geeksforgeeks.org/problems/tower-of-hanoi-1587115621/"},
        {"title": "Reverse a Stack", "difficulty": "medium", "topic": "recursion",
         "description": "Reverse a stack using recursion",
         "solution_link": "https://www.geeksforgeeks.org/problems/reverse-a-stack/"},
        {"title": "Permutations of String", "difficulty": "medium", "topic": "recursion",
         "description": "Generate all unique permutations of string",
         "solution_link": "https://www.geeksforgeeks.org/problems/permutations-of-a-given-string/"},
        {"title": "Subsets", "difficulty": "medium", "topic": "recursion",
         "description": "Generate power set of a set of integers",
         "solution_link": "https://leetcode.com/problems/subsets/"},

        # 5. greedy
        {"title": "Jump Game", "difficulty": "medium", "topic": "greedy",
         "description": "Determine if you can reach the last index",
         "solution_link": "https://leetcode.com/problems/jump-game/"},
        {"title": "Gas Station", "difficulty": "medium", "topic": "greedy",
         "description": "Find starting gas station index to complete circuit",
         "solution_link": "https://leetcode.com/problems/gas-station/"},
        {"title": "Activity Selection", "difficulty": "medium", "topic": "greedy",
         "description": "Select maximum number of activities",
         "solution_link": "https://www.geeksforgeeks.org/problems/activity-selection-1587115620/"},
        {"title": "Fractional Knapsack", "difficulty": "medium", "topic": "greedy",
         "description": "Maximize total value in knapsack using fractions",
         "solution_link": "https://www.geeksforgeeks.org/problems/fractional-knapsack-1587115620/"},
        {"title": "Minimum Platforms", "difficulty": "medium", "topic": "greedy",
         "description": "Find minimum railway platforms required",
         "solution_link": "https://www.geeksforgeeks.org/problems/minimum-platforms-1587115620/"},
        {"title": "Job Sequencing", "difficulty": "medium", "topic": "greedy",
         "description": "Sequence jobs to maximize total profit",
         "solution_link": "https://www.geeksforgeeks.org/problems/job-sequencing-problem/"},

        # 6. hashing
        {"title": "Two Sum", "difficulty": "easy", "topic": "hashing",
         "description": "Find indices of two numbers that add to target",
         "solution_link": "https://leetcode.com/problems/two-sum/"},
        {"title": "Group Anagrams", "difficulty": "medium", "topic": "hashing",
         "description": "Group strings that are anagrams using hash map",
         "solution_link": "https://leetcode.com/problems/group-anagrams/"},
        {"title": "Longest Consecutive Sequence", "difficulty": "medium", "topic": "hashing",
         "description": "Find length of longest consecutive elements sequence",
         "solution_link": "https://leetcode.com/problems/longest-consecutive-sequence/"},
        {"title": "Subarray Sum Equals K", "difficulty": "medium", "topic": "hashing",
         "description": "Find total number of subarrays with sum equal to k",
         "solution_link": "https://leetcode.com/problems/subarray-sum-equals-k/"},
        {"title": "Top K Frequent Elements", "difficulty": "medium", "topic": "hashing",
         "description": "Find the k most frequent elements in array",
         "solution_link": "https://leetcode.com/problems/top-k-frequent-elements/"},
        {"title": "Count Distinct Elements", "difficulty": "easy", "topic": "hashing",
         "description": "Count distinct elements in every window of size k",
         "solution_link": "https://www.geeksforgeeks.org/problems/count-distinct-elements-in-every-window/"},

        # 7. stack-queue
        {"title": "Valid Parentheses", "difficulty": "easy", "topic": "stack-queue",
         "description": "Determine if input string of brackets is valid",
         "solution_link": "https://leetcode.com/problems/valid-parentheses/"},
        {"title": "Min Stack", "difficulty": "medium", "topic": "stack-queue",
         "description": "Design stack that supports getMin in O(1)",
         "solution_link": "https://leetcode.com/problems/min-stack/"},
        {"title": "Daily Temperatures", "difficulty": "medium", "topic": "stack-queue",
         "description": "Find number of days until warmer temperature",
         "solution_link": "https://leetcode.com/problems/daily-temperatures/"},
        {"title": "Next Greater Element", "difficulty": "medium", "topic": "stack-queue",
         "description": "Find next greater element for each array item",
         "solution_link": "https://www.geeksforgeeks.org/problems/next-larger-element-1587115620/"},
        {"title": "Implement Queue using Stacks", "difficulty": "easy", "topic": "stack-queue",
         "description": "Implement FIFO queue using two stacks",
         "solution_link": "https://leetcode.com/problems/implement-queue-using-stacks/"},
        {"title": "Largest Rectangle in Histogram", "difficulty": "hard", "topic": "stack-queue",
         "description": "Find area of largest rectangle in histogram",
         "solution_link": "https://leetcode.com/problems/largest-rectangle-in-histogram/"},
        {"title": "Sliding Window Maximum", "difficulty": "hard", "topic": "stack-queue",
         "description": "Find maximum element in sliding window of size k",
         "solution_link": "https://leetcode.com/problems/sliding-window-maximum/"},
    ]
    
    added_count = 0
    skipped_count = 0

    for prob_data in problems:
        # Check if problem with same title AND topic already exists to prevent duplicate insertion
        existing = db.query(Problem).filter(
            Problem.title == prob_data["title"],
            Problem.topic == prob_data["topic"]
        ).first()

        if existing:
            skipped_count += 1
            continue

        problem = Problem(
            id=str(uuid.uuid4()),
            **prob_data
        )
        db.add(problem)
        added_count += 1
    
    db.commit()
    print(f"Seed complete: {added_count} problems added, {skipped_count} existing skipped.")
    db.close()

if __name__ == "__main__":
    seed_problems()
