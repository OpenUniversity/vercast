var util = require('../util.js');
var assert = require('assert');

module.exports = function(graphDB) {
    beforeEach(function(done) {
	graphDB.clear(done);
    });
    function isPrime(x) {
	for(var i = 2; i <= Math.sqrt(x); i++) {
	    if(x%i == 0) return false;
	}
	return true;
    }
    function createGraph(a, b, aMax, done) {
	while(a < aMax) {
	    while(b < a) {
		if(a%b == 0 && isPrime(a/b)) {
		    graphDB.addEdge(b, a/b, a, function(err) {
			if(err) done(err);
			createGraph(a, b+1, aMax, done);
		    });
		    return;
		}
		b++;
	    }
	    b = 1;
	    a++;
	}
	done();
    }
    describe('as GraphDB', function(){
	describe('addEdge', function(){
	    it('should accept an edge and add it to the graph', function(done){
		util.seq([
		    function(_) { graphDB.addEdge("foo", "likes", "bar", _); },
		    function(_) { graphDB.queryEdge("foo", "likes", _.to('shouldBeBar')); },
		    function(_) { assert.equal(this.shouldBeBar, 'bar'); _(); },
		], done)();
	    });
	    it('should create a dual mapping, mapping also the destination to the source', function(done){
		util.seq([
		    function(_) { graphDB.addEdge("foo", "likes", "bar", _); },
		    function(_) { graphDB.queryBackEdge("bar", "likes", _.to('shouldBeFoo')); },
		    function(_) { assert.equal(this.shouldBeFoo, 'foo'); _(); },
		], done)();
	    });
	});
	describe('findCommonAncestor', function(){
	    it('should find the common ancestor of two nodes, and the path to each of them', function(done){
		util.seq([
		    function(_) { graphDB.addEdge('terah', 'p1', 'abraham', _); },
		    function(_) { graphDB.addEdge('abraham', 'p2', 'isaac', _); },
		    function(_) { graphDB.addEdge('isaac', 'p3', 'jacob', _); },
		    function(_) { graphDB.addEdge('jacob', 'p4', 'joseph', _); },
		    function(_) { graphDB.addEdge('abraham', 'p5', 'ismael', _); },
		    function(_) { graphDB.addEdge('isaac', 'p6', 'esaw', _); },
		    function(_) { graphDB.addEdge('jacob', 'p7', 'simon', _); },
		    function(_) { graphDB.findCommonAncestor('simon', 'ismael', _.to('ancestor', 'path1', 'path2')); },
		    function(_) { assert.equal(this.ancestor, 'abraham'); _(); },
		], done)();
	    });
	    it('should handle the case where there are also common descendants', function(done){
		util.seq([
		    function(_) { createGraph(1, 1, 30, _); },
		    function(_) { graphDB.findCommonAncestor(4, 6, _.to('ancestor', 'p1', 'p2')); },
		    function(_) { assert.equal(this.ancestor, 2); _(); },
		], done)();
	    });
	    it('should return the path from the common ancestor to both nodes', function(done){
		util.seq([
		    function(_) { createGraph(1, 1, 30, _); },
		    function(_) { graphDB.findCommonAncestor(8, 10, _.to('ancestor', 'p1', 'p2')); },
		    function(_) { assert.equal(this.ancestor, 2); _(); },
		    function(_) { assert.deepEqual(this.p1, [{l:'2', n:'4'}, {l:'2', n:'8'}]); _(); },
		    function(_) { assert.deepEqual(this.p2, [{l:'5', n:'10'}]); _(); },
		], done)();
	    });
	});
    });
    describe('.findPath(x, y, cb(err, path))', function(){
	it('should return the labels along the edges from x to y', function(done){
	    util.seq([
		function(_) { createGraph(1, 1, 30, _); },
		function(_) { graphDB.findPath(3, 24, _.to('path')); },
		function(_) { var m = 1;
			      for(var i = 0; i < this.path.length; i++) {
				  m *= this.path[i];
			      }
			      assert.equal(m, 8); // 24 / 3
			      _(); },
	    ], done)();

	});
	it('should always take the shortest path', function(done){
	    util.seq([
		function(_) { graphDB.addEdge('a', 'wrong1', 'b', _); },
		function(_) { graphDB.addEdge('b', 'wrong2', 'c', _); },
		function(_) { graphDB.addEdge('a', 'right', 'c', _); },
		function(_) { graphDB.findPath('a', 'c', _.to('path')); },
		function(_) { assert.deepEqual(this.path, ['right']); _() },
	    ], done)();
	});
	it('should handle directed cycles correctly', function(done){
	    util.seq([
		function(_) { graphDB.addEdge('a', 'right1', 'b', _); },
		function(_) { graphDB.addEdge('b', 'right2', 'c', _); },
		function(_) { graphDB.addEdge('c', 'wrong', 'b', _); },
		function(_) { graphDB.addEdge('c', 'right3', 'd', _); },
		function(_) { graphDB.findPath('a', 'd', _.to('path')); },
		function(_) { assert.deepEqual(this.path, ['right1', 'right2', 'right3']); _() },
	    ], done)();
	});

    });

};
