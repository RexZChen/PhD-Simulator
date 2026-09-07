// The whiteboard.
//
// A surface with no cost, no clock and no consequence, which is a thing this game did not have and
// which a six-year simulation about pressure probably should. You click; nothing you drew appears;
// something you half-remember from a lecture appears instead. That is roughly what a whiteboard is
// for, and it is what your hands do while the rest of you is thinking about something else.
//
// It is also not entirely free of consequence, but you have to find that out.

export const BOARD = {
  capacity: 26,        // marks before it is full
  burstNeed: 12,       // clicks inside the window for the thing that is not advertised
  burstMs: 4000,
};

// Fragments, not full derivations — what actually ends up on a lab whiteboard, which is a mixture
// of the load-bearing line, the thing somebody is explaining, and a bracket that never closed.
export const marks = {
  ml: [
    'softmax(QKᵀ/√d)V', '∇θ L = 𝔼[∇θ log πθ · A]', 'ELBO = 𝔼q[log p(x|z)] − KL(q‖p)',
    'L = −Σ y log ŷ', 'x_t = √ᾱ_t x₀ + √(1−ᾱ_t) ε', 'θ ← θ − η∇L', 'p(y|x) ∝ p(x|y)p(y)',
    'W ∈ ℝ^(d×k)', 'LayerNorm(x + Sublayer(x))', 'argmin_θ 𝔼[(f_θ(x) − y)²]',
  ],
  theory: [
    'O(n log n)', 'P =? NP', 'VC(H)=d ⟹ m = O(d/ε²)', 'Σ_{i=1}^n i = n(n+1)/2',
    '∀ε>0 ∃δ>0', 'T(n) = 2T(n/2) + O(n)', 'Pr[X ≥ a] ≤ 𝔼[X]/a', '‖x‖₂ ≤ √n‖x‖∞',
    'A ⊆ B ⟺ A ∩ B̄ = ∅', 'lim_{n→∞} (1+1/n)ⁿ = e',
  ],
  systems: [
    'p99 < 40ms', 'throughput = 1/(s + (1−s)/N)', 'cache line = 64B', 'O(1) amortised',
    'lock-free ⇒ CAS loop', 'RTT/2 + q', 'reads:writes ≈ 9:1', 'shard by hash(k) mod N',
    'commit ⇒ fsync', 'tail latency ≠ mean',
  ],
  loose: [
    'why?', 'does this hold if d ≫ n ?', '←— NO', 'ask R2', 'baseline??', 'see Thm 3',
    '(check units)', 'this is the whole paper', '↯', 'TODO', 'seed=1337', 'reviewer 2 was right',
    'do not use this slide', '≈ 3 weeks', 'DO NOT ERASE',
  ],
};

// What the room says when you clear it. Erasing a whiteboard is a small ceremony and everybody
// who has done it knows the feeling.
export const eraseLines = [
  'You wipe it down. Somebody had written DO NOT ERASE in the corner in a different hand, three years ago, and you erase that too.',
  'Clean board. It stays clean for about forty minutes.',
  'The eraser leaves a grey ghost of everything, which is the honest state of most research.',
  'Gone. You photograph it first, out of a habit you developed after the one time you did not.',
];

export const fullLine = 'The board is full. There is a convention that you write on the window next, and you have seen somebody do it.';

// The thing that is not advertised.
export const flowLine = 'Twenty minutes go somewhere. You are not aware of having decided anything and there is a line on the board that was not there before, and it is right.';
export const boardNote = 'A whiteboard. It costs nothing and it is not for anything.';
