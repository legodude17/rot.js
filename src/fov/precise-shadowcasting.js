var L = function() { 
	return;
	var args = [];
	for (var i=0;i<arguments.length;i++) {
		var a = arguments[i];
		args.push(a instanceof Array ? a.join(",") : a);
	}
	return console.log.apply(console, args); 
}

/**
 * @class Precise shadowcasting algorithm
 * @augments ROT.FOV
 */
ROT.FOV.PreciseShadowcasting = function(lightPassesCallback, options) {
	ROT.FOV.call(this, lightPassesCallback, options);
}
ROT.FOV.PreciseShadowcasting.extend(ROT.FOV);

/**
 * @see ROT.FOV#compute
 */
ROT.FOV.PreciseShadowcasting.prototype.compute = function(x, y, R, callback) {
	/* this place is always visible */
	callback(x, y, 0);

	/* standing in a dark place. FIXME is this a good idea?  */
	if (!this._lightPasses(x, y)) { return; }
	
	/* list of all shadows */
	var SHADOWS = [];
	
	var cx, cy, blocks, A1, A2;

	/* analyze surrounding cells in concentric rings, starting from the center */
	for (var r=1; r<=R; r++) {
		L("circle at r=", r);
		var neighbors = this._getCircle(x, y, r);
		var neighborCount = neighbors.length;

		for (var i=0;i<neighborCount;i++) {
			cx = neighbors[i][0];
			cy = neighbors[i][1];
			/* shift half-an-angle backwards to maintain consistency of 0-th cells */
			A1 = [i ? 2*i-1 : 2*neighborCount-1, 2*neighborCount];
			A2 = [2*i+1, 2*neighborCount]; 
			L("new arc", A1, A2);
			
			blocks = !this._lightPasses(cx, cy);
			if (this._checkVisibility(A1, A2, blocks, SHADOWS)) { callback(cx, cy, r); }

			L("current shadows:", SHADOWS);
			if (SHADOWS.length == 2 && SHADOWS[0][0] == 0 && SHADOWS[1][0] == SHADOWS[1][1]) { L("cutoff at", SHADOWS); return; } /* cutoff? */

		} /* for all cells in this ring */
	} /* for all rings */
}

/**
 * @param {int[2]} A1 arc start
 * @param {int[2]} A2 arc end
 * @param {bool} blocks Does current arc block visibility?
 * @param {int[][]} SHADOWS list of active shadows
 */
ROT.FOV.PreciseShadowcasting.prototype._checkVisibility = function(A1, A2, blocks, SHADOWS) {
	L("checking arc", A1, A2, "whose blocking is", blocks);

	if (A1[0] > A2[0]) { /* split into two sub-arcs */
		L("zero encountered - splitting into two");
		var v1 = arguments.callee(A1, [A1[1], A1[1]], blocks, SHADOWS);
		var v2 = arguments.callee([0, 1], A2, blocks, SHADOWS);
		return (v1 || v2);
	}

	/* index1: first shadow >= A1 */
	var index1 = 0, edge1 = false;
	while (index1 < SHADOWS.length) {
		var old = SHADOWS[index1];
		var diff = old[0]*A1[1] - A1[0]*old[1];
		if (diff >= 0) { /* old >= A1 */
			if (diff == 0 && !(index1 % 2)) { edge1 = true; }
			break;
		}
		index1++;
	}

	/* index2: last shadow <= A2 */
	var index2 = SHADOWS.length, edge2 = false;
	while (index2--) {
		var old = SHADOWS[index2];
		var diff = A2[0]*old[1] - old[0]*A2[1];
		if (diff >= 0) { /* old <= A2 */
			if (diff == 0 && (index2 % 2)) { edge2 = true; }
			break;
		}
	}

	var visible = true;
	if (index1 == index2 && (edge1 || edge2)) {  /* subset of existing shadow, one of the edges match */
		visible = false; 
	} else if (edge1 && edge2 && index1+1==index2 && (index2 % 2)) { /* completely equivalent with existing shadow */
		visible = false;
	} else if (index1 > index2 && (index1 % 2)) { /* subset of existing shadow, not touching */
		visible = false;
	}

	L("index1", index1, "index2", index2, "edge1", edge1, "edge2", edge2);
	L("visible", visible);

	if (!visible || !blocks) { return visible; } /* fast case: either it is not visible or we do not need to adjust blocking */
	/* adjust list of shadows (implies visibility) */
	var remove = index2-index1+1;
	if (remove % 2) {
		if (index1 % 2) { /* first edge within existing shadow, second outside */
			SHADOWS.splice(index1, remove, A2);
		} else { /* second edge within existing shadow, first outside */
			SHADOWS.splice(index1, remove, A1);
		}
	} else {
		if (index1 % 2) { /* both edges within existing shadows */
			SHADOWS.splice(index1, remove);
		} else { /* both edges outside existing shadows */
			SHADOWS.splice(index1, remove, A1, A2);
		}
	}

	return true;
}