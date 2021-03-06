module.exports = function() {
    this.sched = {}
    this.register = function(conds, callback) {
	var reg = {cb: callback,
		   count: conds.length};
	for(var i = 0; i < conds.length; i++) {
	    var cbs = this.sched[conds[i]];
	    if(cbs) {
		cbs.push(reg);
	    } else {
		this.sched[conds[i]] = [reg];
	    }
	}
    }
    this.notify = function(cond) {
	var cbs = this.sched[cond];
	if(cbs) {
	    for(var i = cbs.length; i >= 0; i--) {
		var reg = cbs[i];
		if(!reg) continue;
		reg.count--;
		if(reg.count == 0) {
		    setTimeout(reg.cb, 0);
		}
	    }
	}
	delete this.sched[cond];
    }
}