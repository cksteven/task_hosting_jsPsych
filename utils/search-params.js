const searchParams = new URLSearchParams(window.location.search);

export default Array.from(searchParams.entries()).reduce((acc, [key, value]) => {
//   console.log("!!!", key, value);
  if (typeof value === 'string' && value.toLowerCase() === 'true') {
    acc[key] = true;
  } else if (typeof value === 'string' && value.toLowerCase() === 'false') {
    acc[key] = false;
  } else {
    acc[key] = value;
  }
//   console.log("RETURN ACC", acc);
  return acc;
}, {});
