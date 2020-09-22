class Node {
  constructor(url){
    this.domain = url.pop()
    this.children = []
    if(url.length > 0) this.create(url)

    // UI
    this.color = "white"
  }

  create(subdomain) {
    let new_node = new Node(subdomain)
    this.children.push(new_node)
    return new_node
  }

  find(domain) {
    return this.children.find((child) => { return child.domain == domain })
  }

  find_or_create(subdomain) {
    let matching_child = this.find(subdomain.slice(-1)[0])
    if(matching_child) {
      let new_subdomains = subdomain.slice(0,-1)
      if(new_subdomains.length > 0) matching_child.find_or_create(new_subdomains)
    } else {
      this.create(subdomain)
    }
  }

  query(domain) {
    if(this.domain == domain.pop()){
      let matches_at_the_end = this.children.map((c) => c.query(domain.copyWithin())).reduce( (a,b) => a || b, false)
      if((domain.length == 0) || (domain.length > 0 && matches_at_the_end)) {
        this.color = "orange"
        return true
      }
    }
    return false
  }


  leaves_count() {
    if(this.children.length > 0) {
      return this.children.map((c) => { return c.leaves_count() }).reduce((a,b) => a + b, 0)
    } else {
      return 1;
    }
  }

  draw_line(context, n_x, n_y, c_x, c_y, c_color) {
    context.beginPath();
    context.moveTo(n_x, n_y + 30);
    context.lineWidth = 2.5;
    context.lineTo(c_x, c_y - 30);
    context.strokeStyle = c_color;
    context.stroke();
  }

  draw(context, x, y, width, height) {
    //Text
    context.font = "20px Arial";
    context.fillStyle = this.color;
    context.textAlign = "center";
    context.fillText(this.domain, x + width/2 , y);

    let children_share = this.children.map((child) => { return child.leaves_count() })
    let c_x = x
    let c_y = y + HEIGHT
    if(children_share.length > 0) {
      let children_space = width/children_share.reduce((a,b) => a + b, 0)
      for(let child_i in this.children) {
        let child_space = children_space * children_share[child_i]
        let child = this.children[child_i]
        child.draw(context, c_x, c_y, child_space, height)

        this.draw_line(context, x + width/2 , y, c_x + child_space/2, c_y, child.color)
        c_x += child_space
      }
    }
  }

  clear() {
    this.color = "white"
    this.children.map( (c) => c.clear() )
  }
}


// UI
var root = new Node(["."])
const canvas = document.getElementById("myCanvas");
const context = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const HEIGHT = 100

function draw() {
  context.clearRect(0, 0, canvas.width, canvas.height);
  root.draw(context, 0, 50, canvas.width, canvas.height)
}


function clear() {
  root.clear()
}

function addDomains(urls){
  for(let url of urls) {
    if(/^\.?$/.test(url[-1])) url.pop()
    if(url.length > 0) root.find_or_create(url.split("."))
  }
  draw()
}

function add() {
  clear()
  addDomains(document.getElementById("url").value.split(/\r\n|\n/))
}

function query(){
  clear()
  var url = document.getElementById("url_query").value.split(".")
  if(/^\.?$/.test(url[-1])) url.pop()
  url.push(".")
  console.log(url)
  if(url.length > 0) root.query(url)
  draw()
}

function create() {
  const file = document.getElementById('file').files[0]
  const reader = new FileReader();
  root =  new Node(["."])

  reader.onload = (event) => {
    const file = event.target.result
    addDomains(file.split(/\r\n|\n/));
  };

  reader.onerror = (event) => {
      alert(event.target.error.name);
  };

  reader.readAsText(file);
}

const file_input = document.getElementById("file");
const filename = document.getElementById("filename")
file_input.onchange = function(){
  filename.innerHTML = `You just uploaded ${this.files[0].name}`
  console.log(filename.text)
};

draw()
