import React from "react";

function page() {
  return (
    <div className="flex flex-col justify-center items-center h-screen">
      <div className="relative flex justify-center items-center size-28">
        <img src="/images/icon-code.png" alt="demo" className="absolute bottom-10 left-1 size-15 -rotate-[30deg]" />
        <img src="/images/icon-image.png" alt="demo" className="absolute bottom-0 size-15" />
        <img src="/images/icon-doc.png" alt="demo" className="absolute bottom-12 right-3 size-12 rotate-[30deg]" />

      </div>
    </div>
  );
}

export default page;
