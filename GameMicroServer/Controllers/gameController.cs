using Microsoft.AspNetCore.Mvc;
using System.IO;
using System.Linq;
using System.Net;

namespace Micro
{
    public class gameController : Controller
    {
        [HttpGet("tetris")]
        public IActionResult GetTetris()
        {
            // Specify the path to the tetris.js file
            string relativePath = Path.Combine("Games", "tetris.js");
            string filePath = Path.Combine(Directory.GetCurrentDirectory(), relativePath);
            Console.WriteLine(filePath);
            // Check if the file exists
            if (!System.IO.File.Exists(filePath))
            {
                Console.WriteLine("File not found" + filePath);
                return NotFound();
            }

            // Read the content of the file
            string fileContents = System.IO.File.ReadAllText(filePath);

            // Return the content of the file as a string
            return Content(fileContents, "application/javascript");
        }
    }
}