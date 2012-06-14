#!/usr/bin/python


from xml.dom.minidom import *

dom=parse('text.svg')
path_string=''
defs=dom.getElementsByTagName('defs')[0]
symbols=defs.getElementsByTagName('symbol')
uses=defs.getElementsByTagName('use')

for use in uses:
   ref=use.getAttribute('xlink:href')[1:100]
   x=use.getAttribute('x')
   y=use.getAttribute('y')
   for symbol in symbols:
       if  ref == symbol.getAttribute("id"):
           path=symbol.getElementsByTagName('path')[0]
           path_d=path.getAttribute('d')
           d_split=path_d.split()
           idx=0
           offset=[x,y]
           for item in d_split:
               if len(item) ==  1:
                   if not item.isdigit() :
                       path_string+=item+" "
                       continue
               path_string+=str(float(offset[idx])+float(item))+" "
               idx+=1
	       idx=idx%2
dom.unlink()
print path_string
           
