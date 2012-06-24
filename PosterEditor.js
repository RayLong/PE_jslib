var poster_editor={
    template_type: "free_template",

    raphael_editor: null,

    canvas_div:null,
    
    backgroundImage: null,


    attachCanvas: function(canvas) {
	if ( this.canvas_div !== canvas ) {
		this.canvas_div=canvas;
	        this.raphael_editor = new VectorEditor(canvas, canvas.offsetWidth, canvas.offsetHeight);
		this.canvas_div.className="free_template";
		this.raphael_editor.setMode("select");
	}
    },
    
    setBackgroundImage: function(url) {
	if(this.canvas_div) {
	      this.backgroundImage=url;
	      this.canvas_div.style.backgroundImage="url('"+url+"')";
	      this.canvas_div.style.backgroundRepeat="no-repeat";
	      this.canvas_div.style.backgroundPosition="center";
	}
    },

    addImage: function (url, x, y, w, h) {
      if (!this.raphael_editor)
	    throw "editor hasn't initialized!";
      var shape=this.raphael_editor.draw.image(url,x,y,w,h);
      this.raphael_editor.addShape(shape,1);
      return shape;
    },

    getObjData: function (Obj) {
      if (!this.raphael_editor)
         throw "editor hasn't initialized!";
      if( this.raphael_editor.in_array(Obj,this.raphael_editor.shapes) != -1) {
         if (Obj.type == 'image')
             return {left:Obj.attr("x"),top:Obj.attr("y"),width:Obj.attr("width"),height:Obj.attr("height"),angle:Obj.attr("rotation")};
         else if (Obj.type == 'path') {
             var box=Obj.getBBox();
             return {left:box.x, top:box.y, width:box.width, height:box.height, angle: Obj.attr('rotation')};
         }
      } else
        return {};
    },

    deleteObject: function(Obj) {
       if (!this.raphael_editor)
           throw "editor hasn't initialized!";
       if( this.raphael_editor.in_array(Obj,this.raphael_editor.shapes) != -1) {
           this.raphael_editor.deleteShape(Obj);
       }
    },
 
    getSelected: function() {

       if (this.raphael_editor && this.raphael_editor.selected.length)
          return this.raphael_editor.selected;
       else
          return []

    },

    renderText: null,

    addText: function (text, x, y, options) {
	if (!this.renderText)
		throw "no renderText callback!";
        if (! options)
           var options={fontSize:'16',fontColor:'black',
                        fontStyle:'normal',fontFamily:'arial'};
        options.fontSize=options.fontSize || '16';
        options.fontColor=options.fontColor || 'black';
        options.fontStyle=options.fontStyle || 'normal';
        options.fontFamily=options.fontFamily || 'arial';
	var path_txt=this.renderText(text,options);
        if (path_txt) {
		var shape=this.raphael_editor.draw.path(path_txt);
		shape.node.id="text_"+shape.id;
		shape.node.style.fontSize=options.fontSize;
		shape.node.style.fontFamily=options.fontFamily;
		shape.node.style.color=options.fontColor;
		shape.node.style.fontStyle=options.fontStyle;
		shape.node.textContent=text;
		shape.translate(x,y);
		shape.attr({fill:options.fontColor,fillOpacity:1});
               	this.raphael_editor.addShape(shape,1);
                return shape;
        } else {
		throw "renderText return failed!"
	}
    },

    loadTemplate: function(tp_str) {
        var p;
    },

    toTemplateStr: function () {
        if (this.raphael_editor == null)
            return "";

	var txt="{type:'free_template',backgroundImage:'"+
		this.backgroundImage+"',[";
	var shapes=this.raphael_editor.shapes;
	if (JSON)
    	    for (var ii=0; ii < shapes.length; ii++) {
		    if (ii != 0)
			    txt+=",";
		    switch (shapes[ii].type) {
		      case 'image':
			      txt+="{attrs:"+JSON.stringify(shapes[ii].attrs);
			      txt+=",type:"+JSON.stringify(shapes[ii].type);
			      txt+=",transformations:"+JSON.stringify(shapes[ii].transformations)+"}";
			      break;
		      case 'path':
			      txt+="{attrs:"+JSON.stringify(shapes[ii].attrs);
			      txt+=",type:"+JSON.stringify(shapes[ii].type);
			      txt+=",transformations:"+JSON.stringify(shapes[ii].transformations);

			      txt+=',fontSize:"'+shapes[ii].node.style.fontSize+'"';
			      txt+=',fontFamily:"'+shapes[ii].node.style.fontFamily+'"';
			      txt+=',fontStyle:"'+shapes[ii].node.style.fontStyle+'"}';
			      break;
		    }
	    }
	txt+="]}";
	return txt;
    }
};
