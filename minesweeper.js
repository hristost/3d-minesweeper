function zeros(dimensions) {
  var array = [];

  for (var i = 0; i < dimensions[0]; ++i) {
    array.push(dimensions.length == 1 ? 0 : zeros(dimensions.slice(1)));
  }

  return array;
}
function createBoard(w, h){

  let board = zeros([w, h])
    
  for (var x=0; x<w; x++)
    for (var y=0; y<h; y++)
      board[x][y] = (Math.random()<0.2) ? 9 : 0
  for (var x=0; x<w; x++)
    for (var y=0; y<h; y++)
      if (board[x][y]!=9){
        var n = 0;
        for (var xx=Math.max(0, x-1); xx<=Math.min(w-1, x+1); xx++)
          for (var yy=Math.max(0, y-1); yy<=Math.min(h-1, y+1); yy++)
            if (board[xx][yy]==9) n+=1
        board[x][y]=n
      }
  return board

}
