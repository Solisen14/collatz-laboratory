// Fine-tune the two merge arrows so their arrowheads dock on the diagonal
// edge of the destination circles instead of competing with the horizontal
// cyan arrowheads at the circles' leftmost points.

const mergeArrowBaseRenderBranchingStage = renderBranchingStage;

function dockMergeArrowheads() {
  const diagonals = sequenceArea.querySelectorAll('.branch-merge-diagonal');
  if (diagonals.length < 2) return;

  // 20 -> 10: terminate on the upper-left edge of the 10 circle.
  diagonals[0].setAttribute('x2', '224.8');
  diagonals[0].setAttribute('y2', '160.2');

  // 32 -> 16: terminate on the lower-left edge of the 16 circle.
  diagonals[1].setAttribute('x2', '444.8');
  diagonals[1].setAttribute('y2', '199.8');
}

renderBranchingStage = function(options = {}) {
  mergeArrowBaseRenderBranchingStage(options);
  dockMergeArrowheads();
  requestAnimationFrame(dockMergeArrowheads);
};
