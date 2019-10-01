// Class for graph widgets in index.html (comprises a cytoscape object in a container and some buttons)
class Widget {
  constructor(cyCtnId, rmBtnId, tlBtnId, lgBtnId) {
    this.cy = cytoscape({
      container: document.getElementById(cyCtnId), // container to render in

      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#666',
            'label': ''
            // 'label': 'data(id)'
            // 'label': (ele) => ele.degree()
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 3,
            'line-color': '#ccc',
            'target-arrow-color': '#ccc',
            'target-arrow-shape': 'triangle'
          }
        }
      ],
      // userPanningEnabled:false,
    });
    this.rmBtn = document.getElementById(rmBtnId);
    this.tlBtn = document.getElementById(tlBtnId);
    this.lgBtn = document.getElementById(lgBtnId);
    this.lastTappedNodeId = false;
    this.CREATE_EDGE_TIMEOUT = 2500;
    this.idCount = 0;
    this.labelsOn = false;
    // bind all methods to this - see https://stackoverflow.com/a/30649491
    for (let obj = this; obj; obj = Object.getPrototypeOf(obj)){
      for (let name of Object.getOwnPropertyNames(obj)){
        if (typeof this[name] === 'function'){
          // console.log(this[name]);
          this[name] = this[name].bind(this);
        }
      }
    }
    // Button events
    // Could use this.clearCy.bind(this) for example (see https://stackoverflow.com/a/43727582) but easier to just bindAll as above
    this.rmBtn.addEventListener('click', this.clearCy); 
    this.tlBtn.addEventListener('click', this.toggleLabels);
    this.lgBtn.addEventListener('click', this.layoutGraph);
    // cy events
    this.cy.on('tap', this.addNodeIfCy);
    this.cy.on('tap', 'node', this.addEdgeBetweenNodes);
  }
  nextId() {
    return ++this.idCount;
  }
  clearCy() {
    this.cy.remove('*');
    // Disable rmBtn
    this.rmBtn.classList.add('disabled');
    this.rmBtn.disabled = true;
  }
  layoutGraph() {
    this.cy.layout({name: 'cose', animate: false}).run();
  }
  toggleLabels() {
    let labelFunc = this.labelsOn ? '' : (ele) => ele.degree();
    this.cy.style().selector('node').style('label', labelFunc).update();
    this.labelsOn = !this.labelsOn;
  }
  addNodeIfCy(event) {
    if ( event.target !== this.cy ) {return;}
    let node = this.cy.add({
      group: 'nodes',
      data: { id: this.nextId() },
      renderedPosition: { x: event.renderedPosition.x, y: event.renderedPosition.y },
    });
    this.setLastTapped(node.id());
    // Make sure rmBtn is not disabled
    this.rmBtn.classList.remove('disabled');
    this.rmBtn.disabled = false;
  }
  addEdgeBetweenNodes(event) {
    // Target node & its id
    let target = event.target;
    let targetId = target.id();
    // Only add edge if pressed a DIFFERENT node (this.lastTappedNodeId !== targetId) 
    // and within last this.CREATE_EDGE_TIMEOUT milliseconds (this.lastTappedNodeId !== false)
    // and edge doesn't already exist between these nodes (inner if)
    if (this.lastTappedNodeId !== false && this.lastTappedNodeId !== targetId) {
      let source = this.cy.$('#' + this.lastTappedNodeId);
      let possibleEdge = source.edgesTo(target);
      let possibleEdge2 = target.edgesTo(source); // Apparently need to check both directions
      if (possibleEdge.length === 0 && possibleEdge2.length === 0) {
        // Convention for edge ids: 'source-target';
        let edgeId = this.lastTappedNodeId + '-' + targetId;
        this.cy.add([{ group: 'edges', data: { id: edgeId, source: this.lastTappedNodeId, target: targetId } }]);
        this.cy.style().update(); // Ensure style is updated
      }
    }
    this.setLastTapped(targetId);
  } 
  setLastTapped(id) {
    // Remove any current timeOut (otherwise this will set this.lastTappedNodeId = false prematurely)
    if (this.timerId !== false) {
      clearTimeout((this.timerId));
      this.timerId = false;
    }
    this.lastTappedNodeId = id;
    this.timerId = setTimeout(() => this.lastTappedNodeId = false, this.CREATE_EDGE_TIMEOUT );
  }
}


// First widget 
let wig1 = new Widget('cy1', 'cy1-btn-rm', 'cy1-btn-tl', 'cy1-btn-lg');
// p object placed in container of first widget, to display degreeSequence of graph in wig1
wig1.degreeP = document.querySelector('#wig1-degree-p');
// First two buttons and cy of wig1 need an additional event handler to update the degree sequence text
wig1.rmBtn.addEventListener('click', updateDegreeP.bind(wig1)); 
wig1.tlBtn.addEventListener('click', updateDegreeP.bind(wig1));
wig1.cy.on('tap', updateDegreeP.bind(wig1)); // Note will run after e.g. adding a node due to tap
// Change css of p element (using jQuery) when on mouse hover/removal
$("#" + wig1.degreeP.id).hover(
    function(event) {
        // The mouse has entered the element, can reference the element via 'this'
        $(this).css("white-space", "normal");
        $(this).css("word-break", "break-all");
        $(this).css("overflow", "visible");
    },
    function (event) {
        // The mouse has left the element, can reference the element via 'this'
        $(this).css("white-space", "nowrap");
        $(this).css("overflow", "hidden");
        wig1.cy.resize(); // Recalulate viewport bounds (disrupted if degreeP changes size)
    }
 );

// Additional helper function for first widget (seen as only first widget uses this, could refer to wig1 explicitly
// instead of using 'this' and then binding as above)
function updateDegreeP () {
  // this must have a cytoscape object and a html object with an innerText property called 'degreeP'
  let degreeSeq = [];
  let nodes = this.cy.nodes();
  nodes.forEach( node => degreeSeq.push(node.degree()));
  degreeSeq = degreeSeq.sort( (a,b) => b-a );
  this.degreeP.innerText = 'Degree Sequence: (' + degreeSeq + ')';
}

// Graph with degree sequence (1,1,1,3)
let cyDisp1 = cytoscape({
      container: document.getElementById('cy2'), // container to render in
      elements: [ // list of graph elements to start with
        { data: { id: '0' } },
        { data: { id: '1' } },
        { data: { id: '2' } },
        { data: { id: '3' } },
        // { data: { id: '4' } },
        { data: { id: 'e0', source: '0', target: '1' } },
        { data: { id: 'e1', source: '0', target: '2' } },
        { data: { id: 'e2', source: '0', target: '3' } }
      ],
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#666',
            'label': ''
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 3,
            'line-color': '#ccc',
            'target-arrow-color': '#ccc',
            'target-arrow-shape': 'triangle'
          }
        }
      ],
      layout: {
      name: 'cose',
      // name: 'preset',
      animate: false 
    },
      userPanningEnabled:false
    });
// cyDisp1.fit();
cyDisp1.resize(); // Recalculate viewport bounds
// Second widget
// let wig2 = new Widget('cy2', 'cy2-btn-rm', 'cy2-btn-tl', 'cy2-btn-lg');

let degreeSeqInput = document.getElementById('degree-seq-input');
// degreeSeqForm = document.getElementById('degree-seq-form');
// degreeSeqGroup = document.getElementById('degree-seq-group');
degreeSeqInput.addEventListener('input', (event) => {
  // Remove any whitespace and then any trailing commas
  let inputStripped = degreeSeqInput.value.replace(/\s/g , '').replace(/,+$/, '');
  // Split on remaining commas -> javascript array of str, then convert to numbers (if possible)
  let inputDegreeSeq = inputStripped.split(',').map(str => Number(str));
  let graphic = phHasGraphRealisation(inputDegreeSeq);
  if (graphic === undefined) {
    degreeSeqInput.classList.remove('is-valid');
    degreeSeqInput.classList.remove('is-invalid');
  } else if (graphic) {
    degreeSeqInput.classList.add('is-valid');
    degreeSeqInput.classList.remove('is-invalid');
  } else {
    degreeSeqInput.classList.remove('is-valid');
    degreeSeqInput.classList.add('is-invalid');
  }
  // degreeSeqInput.classList.add('is-valid');
  // Replace tickmark with tick + is graphic
  // write version which actually uses button instead of input event
  // degreeSeqForm.classList.add('was-validated');
  // console.log(inputStripped);
  // console.log(inputDegreeSeq);
  // console.log(graphic);
});

/*
 * Tests whether a sequence of non-negative integers is graphic using the Erdos-Gallai theorem
 * @param {array} degreeSeq - Array of vertex degrees. Needn't be ordered.
 * @returns {bool} Whether sequence is graphic or not
 */
function phHasGraphRealisation (degreeSeq) {
  // Check sequence contains non-negative integers only
  if (!phNonNegativeSequence(degreeSeq)) { 
    console.log('Invalid input (vertex degrees must be non-negative).');
    return;
  }
  // Check sum of degrees is even
  if (degreeSeq.reduce((sum, degree) => sum + degree, 0) % 2 === 1) {
    return false;
  }
  // Sort in reverse order as per theorem statement
  degreeSeq = degreeSeq.sort((a,b) => b - a);
  // Loop to calculate theorem formula at each k = 1...n where n is number of vertices
  for (let k = 1; k <= degreeSeq.length; k++) {
    // Get first k (highest degree) terms
    let kHighestDegrees = degreeSeq.slice(0, k);
    // And remaining terms
    let nMinusKLowestDegrees = degreeSeq.slice(k);
    // Sum over all k highest degrees = LHS of formula
    let degreeSum = kHighestDegrees.reduce((sum, degree) => sum + degree, 0);
    // Sum over min(d_i,k) for remaining degrees
    let minSum = nMinusKLowestDegrees.reduce((sum, degree) => sum + Math.min(degree, k), 0);
    // if, at any k, degreeSum > k(k-1) + minSum, sequence is non-graphic
    if (degreeSum > k*(k-1) + minSum) {
      return false;
    }
  }
  // At all k, degreeSum <= k(k-1) + minSum (and sum degrees even) <=> sequence is graphic
  return true;
}
/*
 * Tests whether a given array is consists of non-negative integers only. Used by many of my functions
 * @param {array} sequence - Array of values to be tested
 * @returns {bool} True if array consists of non-negative integers only.
 */
function phNonNegativeSequence (sequence) {
  // Check all elements safe integers (e.g. NOT Infinity, NaN) and positive
  // findIndex returns -1 if test function returns false for each element
  // So findIndex( ele => !Number.isSafeInteger(ele) || ele < 0 ) returns -1 if each element is a safe int and > 0
  return (sequence.findIndex( ele => !Number.isSafeInteger(ele) || ele < 0 ) == -1);
}

// Third cy to illustrate Havel-Hakimi for 3,2,2,1,1,1
let cyDisp2 = cytoscape({
      container: document.getElementById('cy3'), // container to render in
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#666',
            'label': (ele) => 'v'+ele.id()
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 3,
            'line-color': '#ccc',
            'target-arrow-color': '#ccc',
            'target-arrow-shape': 'triangle'
          }
        },
        {
          selector: '.highlight',
          style: {
            'line-color': 'yellow'
            // 'line-color': '#66FF33'
          }
        },
        {
          selector: '.highlight2',
          style: {
            'line-color': 'red'
            // 'line-color': '#CC3333'
          }
        }
      ],
      userPanningEnabled:false
    });
cyDisp2.resize(); // Recalculate viewport bounds
// Add unconnected vertices
let cyDisp2Width = cyDisp2.width();
let cyDisp2Height = cyDisp2.height();
cyDisp2.add([
  {data:{id:'2'}, renderedPosition: {x:3*cyDisp2Width/9,y:3*cyDisp2Height/6}},
  {data:{id:'1'}, renderedPosition: {x:4*cyDisp2Width/9,y:1*cyDisp2Height/6}},
  {data:{id:'3'}, renderedPosition: {x:4*cyDisp2Width/9,y:5*cyDisp2Height/6}},
  {data:{id:'0'}, renderedPosition: {x:5*cyDisp2Width/9,y:3*cyDisp2Height/6}},
  {data:{id:'5'}, renderedPosition: {x:6*cyDisp2Width/9,y:1*cyDisp2Height/6}},
  {data:{id:'4'}, renderedPosition: {x:6*cyDisp2Width/9,y:5*cyDisp2Height/6}}
]);
// Could put all on one graph and just use buttons to pan...
let prevBtn = document.getElementById('cy3-btn-prev');
let nextBtn = document.getElementById('cy3-btn-next');
// let havelSequenceP = document.getElementById('disp2-sequence-p');
let cyDisp2ps = document.querySelectorAll('#cy3 > p');
// S_0 initially visible
cyDisp2ps[0].style.visibility = 'visible';
// Keep track of which iteration 0 (initial)...3 of algorithm we are on
let stepNumber = 0;
let cyDisp2Collections = [
  [{data:{source: '0', target: '1' , weight:0}},
   {data:{source: '0', target: '2' , weight:0}},
   {data:{source: '0', target: '3' , weight:0}}],
  [{data:{source: '1', target: '2', weight:1}}],
  [{data:{source: '4', target: '5', weight:2}}]
  ];
let totalSteps = cyDisp2Collections.length;
prevBtn.addEventListener('click', havelStep.bind(null,foward=false));
nextBtn.addEventListener('click', havelStep);
let cyDisp2TimerId = false;
function havelStep (forward=true) {
  // Add/remove edges depending on stepNumber
  if (forward) {
    let addedEdges = cyDisp2.add(cyDisp2Collections[stepNumber]);
    addedEdges.flashClass('highlight',500);
    stepNumber++;
  } else {
    if (cyDisp2TimerId !== false) {
      clearTimeout(cyDisp2TimerId);
      cyDisp2.remove('edge[weight = ' + stepNumber + ']');
    }
    let edgesToRemove = cyDisp2.edges('edge[weight = ' + (stepNumber-1) + ']');
    cyDisp2TimerId = setTimeout( () => {
      cyDisp2.remove(edgesToRemove);
      cyDisp2TimerId = false;
    }, 500);
    edgesToRemove.flashClass('highlight2',500);
    stepNumber--;
  }
  // Update sequence text by simply un-hiding a p element (couldn't get dynamic MathJax to work)
  cyDisp2ps.forEach( (p, index) => {
    if (index === stepNumber) {
      p.style.visibility = 'visible';
    } else {
      p.style.visibility = 'hidden';
    }
  });
  // Enable/disable 'Previous' and 'Next' buttons as appropriate
  switch(stepNumber) {
    case 0:
      prevBtn.classList.add('disabled');
      prevBtn.disabled = true;
      break;
    case 1:
      prevBtn.classList.remove('disabled');
      prevBtn.disabled = false;
      break;
    case totalSteps-1:
      nextBtn.classList.remove('disabled');
      nextBtn.disabled = false;
      break;
    case totalSteps:
      nextBtn.classList.add('disabled');
      nextBtn.disabled = true;
      break;
  }
}

// Final widget
let cyDisp3 = cytoscape({
      container: document.getElementById('cy4'), // container to render in
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#666',
            'label': ''
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 3,
            'line-color': '#ccc',
            'target-arrow-color': '#ccc',
            'target-arrow-shape': 'triangle'
          }
        }
      ],
      userPanningEnabled:false
    });
let cy4Id = 0;
function cy4NextId() {
  return cy4Id++;
}
let degreeSeqInput2 = document.getElementById('degree-seq-input2');
let cy4Btn = document.getElementById('cy4-btn-gen');
let cy4InpurtDegreeSeq;
degreeSeqInput2.addEventListener('input', (event) => {
  // Remove any whitespace and then any trailing commas
  let inputStripped = degreeSeqInput2.value.replace(/\s/g , '').replace(/,+$/, '');
  // Split on remaining commas -> javascript array of str, then convert to numbers (if possible)
  cy4InpurtDegreeSeq = inputStripped.split(',').map(str => Number(str));
  let graphic = phHasGraphRealisation(cy4InpurtDegreeSeq);
  if (graphic === undefined) {
    degreeSeqInput2.classList.remove('is-valid');
    degreeSeqInput2.classList.remove('is-invalid');
    cy4Btn.classList.add('disabled');
    cy4Btn.disabled = true;
  } else if (graphic) {
    degreeSeqInput2.classList.add('is-valid');
    degreeSeqInput2.classList.remove('is-invalid');
    cy4Btn.classList.remove('disabled');
    cy4Btn.disabled = false;
    // cy4Btn.addEventListener('click', (event) => phMakeGraph(cyDisp3, cy4InpurtDegreeSeq));
    // We have to remove layout function and then add it, otherwise on first click an empty graph will be laid out,
    // then a graph added and not laid out
    cy4Btn.removeEventListener('click', cy4Layout);
    // Only run this event once (if we didn't, upon changing input events for constructing multiple graphs would be
    // added, and not straightforward to remove previous listeners due to anonymous func etc.)
    cy4Btn.addEventListener('click', (event) => phMakeGraph(cyDisp3, cy4InpurtDegreeSeq), {once:true});
    cy4Btn.addEventListener('click', cy4Layout);
  } else {
    degreeSeqInput2.classList.remove('is-valid');
    degreeSeqInput2.classList.add('is-invalid');
    cy4Btn.classList.add('disabled');
    cy4Btn.disabled = true;
  }
});
// Layout graph using event listeners not in phMakeGraph so user can repeatedly click
// 'generate' without changing input and appears to regenerate graph (not straightforward
// to actually have graph regenerated as using once:true in event listener above)
function cy4Layout() {
  let layout = cyDisp3.elements().layout({
    name: 'cose', // Compound Spring Embedder layout -  uses a physics simulation to lay out graphs.
    animate: false // Don't animate when running the layout
  });
  // run layout
  layout.run();
}
/*
 * Perform Havel-Hakimi algorithm to generate a graph from a degree sequence
 * @param {cytoscape} cy - cytoscape instance to add graph to
 * @param {array} degreeSeq - Array of vertex degrees. Needn't be ordered
 * @param {bool} degreeLabels - Whether to label nodes with their degree
 * @param {bool} fixed - if true graph built will always be the same. N.B. The fixed procedure is such that the 
 constructed graph will be connected, IF a connected realisation exists.
 * @returns {cytoscape collection} - collection of nodes & edges added to cy
 */
function phMakeGraph (cy, degreeSeq, degreeLabels=false, fixed=true) {
  // Clear any previous graph
  cy.remove('*');
  // Check sequence contains non-negative integers only
    if (!phNonNegativeSequence(degreeSeq)) {
      console.error('Vertex degrees must be non-negative.');
      return false;
    }
    // If sum of degrees exceeds |E(K_n)| = n(n-1)/2 (total number of vertices in complete graph of n vertices),
    // more efficient to perform algorithm on complement
    let take_complement = false;
    let numVerts = degreeSeq.length;
    let double_num_edges = degreeSeq.reduce((sum, degree) => sum + degree, 0);
    let number_complete = (numVerts)*(numVerts - 1)/2;
    if (double_num_edges > number_complete) {
      // Degree d_i maps to (n-1) - d_i under complement
      degreeSeq = degreeSeq.map( degree => (numVerts - 1) - degree);
      // After performing the algorithm we will need to take the complement
      take_complement = true;
    }
  // Flag to indicate whether sequence is graphic (true) or not (false); set on termination of algorithm
  let graphic;
  // Array of vertices describing graph
  let vertArr = [];
  degreeSeq = degreeSeq.sort( (a,b) => b - a ); // Decreasing order
  degreeSeq.forEach( degree => vertArr.push(new pVertex(degree)) );
    // Array of edges used to create connected graph in cytoscape, if cy provided. 
    let edgeArr = []; 
    // Perform the recursive algorithm on a copy of vertArr; sets graphic and constructs edgeArr
  let vertArrCopy = JSON.parse(JSON.stringify(vertArr));
    havelHakimi(vertArrCopy);
    // If cy == null, just return whether sequence is graphic
    if (cy == null) {
      return graphic;
    }
    // Otherwise we construct a graph (if possible) using edgeArr and add to cytoscape instance
    if (!graphic) {
      console.error('Degree sequence is non-graphic.');
      return false;
    }
    // If the 'complement degrees' were used above now must take complement of graph represented by edgeArr
    if (take_complement) {
      let complementEdgeArr = [];
      for (let i=0; i < numVerts; i++) {
        for (let j=0; j < i; j++) {
          if (edgeArr.findIndex( edge => 
            edge.source === vertArr[i].id && edge.target === vertArr[j].id ||
            edge.source === vertArr[j].id && edge.target === vertArr[i].id
            ) === -1) {
            complementEdgeArr.push(new pEdge(vertArr[i].id, vertArr[j].id));
          }
        }
      }
      edgeArr = complementEdgeArr;
    }
    // Collection of elements added by this function, returned to caller 
    // Also allows us to edit the style/layout for added graph without affecting rest of cytoscape instance.
    let havelCollection = cy.collection();
    buildGraph();
  // Pan and zoom to fit all elements of cytoscape instance
    cy.fit();
  // cy.fit(havelCollection); // Pan and zoom to newly created graph (only)
    return havelCollection;


    // ~ Description of procedure (fixed=true) ~
    /* Choose random (final) vertex sequence and 'attach' to the d vertices remaining vertices with the largest degrees.
    Here d is the degree of the chosen vertex and 'attach' translates to: Create an pEdge, add it to edgeArr, and
    decrement target vertex degrees. Remove the chosen vertex as well as any other vertex whose degree is turned 0. 
    Repeat until all vertices exhausted or algorithm fails due to inability to 'exhaust' chosen node.
    This is performed recursively.
    */
    function havelHakimi (remainingVerts) {
      // Remove any exhausted vertices (done prior to .pop() as if take_complement may have vertices of 0 degree)
      remainingVerts = remainingVerts.filter( vertex => vertex.degree !== 0);
      // ALgorithm continues until all vertices exhausted (positive solution)
      if (remainingVerts.length === 0) {
          graphic = true;
          return;
      }
      // Sort the remanding array of vertices in descending order of degree
      remainingVerts = remainingVerts.sort( (v1, v2) => v2.degree - v1.degree );
      // If want to generate same graph each time, always select vertex with smallest degree. Otherwise choose at random
    let chosenVertex;
    if (fixed) {
      // N.B. Choosing smallest degree vertex guarantees a connected graph, if such a realisation exists
      // See "Building connected graphs" http://szhorvat.net/pelican/hh-connected-graphs.html
      chosenVertex = remainingVerts.pop();
    } else {
      chosenVertex = remainingVerts.splice(Math.floor(Math.random()*remainingVerts.length), 1)[0];
    }
    // One iteration: Remove vertex of (smallest) degree X; subtract 1 from the degrees of vertices with X largest degrees
    // e.g. [5,4,4,2] -> [4,3,4]
    // Algorithm fails (graph non graphic) if not enough vertices to connect to
    if (chosenVertex.degree > remainingVerts.length) {
      graphic = false;
      return;
    }
    for (let i=0; i < chosenVertex.degree; i++) {
      // Subtract 1 from degree number of remaining vertices, starting with that which has the largest degree
      remainingVerts[i].degree -= 1;
      // Add an edge between chosen and target vertex
      edgeArr.push(new pEdge(chosenVertex.id, remainingVerts[i].id)); 
    }
    // Continue until all vertices exhausted
    return havelHakimi(remainingVerts);
    }

    function buildGraph () {
    // Add vertices (cytoscape nodes)
    vertArr.forEach ( vertex => {
      let node = cy.add({ group: 'nodes', data: { id: vertex.id }});
      havelCollection = havelCollection.union(node);
    });
    // Add edges generated by addLeaf recursive procedure. 
    edgeArr.forEach( edge => {
      let cyEdge = cy.add([{ group: 'edges', data: { id: edge.id, source: edge.source, target: edge.target } }]);
      havelCollection = havelCollection.union(cyEdge);
    });
    // Label each vertex according to its degree, if requested
    if (degreeLabels) {
      let nodeCollection = havelCollection.nodes();
      nodeCollection.forEach( (node) => node.style('label', (ele) => ele.degree()) );
    }
    // // Set and run a layout for the graph  (affects havelCollection only)
    // var layout = havelCollection.layout({
    //   name: 'cose', // Compound Spring Embedder layout -  uses a physics simulation to lay out graphs.
    //   animate: false // Don't animate when running the layout
    // });
    // // run layout
    // layout.run();
    }
}
// Classes to conveniently encapsulate vertices and edges of a graph - used by phMakeGraph, phMakeBipartite, phMakeTree, phEnumerateTrees
// Each vertex has a unique id and a degree
class pVertex {
  constructor(degree) {
    this.id = cy4NextId();
    this.degree = degree;
  }
}
// Each edge has an id as we as a 'source' and a 'target' (ids of the two vertices incident to the edge)
class pEdge {
  constructor(source, target) {
    this.id = cy4NextId();
    this.source = source;
    this.target = target;
  }
}