import { cuisine, diet, dishType, nutrition } from "@/db/schema/recipe";
import { db } from "@/db";
import { NextResponse } from "next/server";

export async function POST() {
  const insertCuisinesQuery = db.insert(cuisine).values([
    {
      adjective: "Canadian",
      icon: `${process.env.NEXT_PUBLIC_IMAGE_BUCKET_URL}/flags/canada-flag.png`,
      iconSource: "https://vectorflags.com/canada/ca-circle-01",
      description: "Canadian cuisine consists of the cooking traditions and practices of Canada, with regional variances around the country. It privileges the quality of ingredients and regionality, and may be broadly defined as a national tradition of creole culinary practices, based on the complex multicultural and geographically diverse nature of both historical and contemporary Canadian society."
    },
    {
      adjective: "American",
      icon: `${process.env.NEXT_PUBLIC_IMAGE_BUCKET_URL}/flags/usa-flag.png`,
      iconSource: "https://vectorflags.com/united-states/us-circle-01",
      description: "The U.S. is a melting pot of cultures as a result of the many people that came here from various other countries across the globe. A significant part of this equation, too, comes from the cultures of Indigenous peoples who lived on the land well before colonization. With this bountiful combination of culinary traditions, American cuisine has become greater than the sum of its parts and offers something unique. The nation has established several dishes that many consider examples of an American food tradition."
    },
    {
      adjective: "Mexican",
      icon: `${process.env.NEXT_PUBLIC_IMAGE_BUCKET_URL}/flags/mexico-flag.png`,
      iconSource: "https://vectorflags.com/mexico/mx-circle-01",
      description: "Mexican cuisine is one of the most popular and beloved cuisines in the world, with a rich history and a diverse range of flavors and ingredients. This cuisine is known for its bold and spicy flavors, as well as its use of fresh and vibrant ingredients."
    },
    {
      adjective: "Greek",
      icon: `${process.env.NEXT_PUBLIC_IMAGE_BUCKET_URL}/flags/greece-flag.png`,
      iconSource: "https://vectorflags.com/greece/gr-circle-01",
      description: "Greek cuisine is a testament to the richness and diversity of Mediterranean food. Known for its bold flavors, fresh ingredients, and health benefits, it's a culinary tradition steeped in history and culture."
    },
    {
      adjective: "Italian",
      icon: `${process.env.NEXT_PUBLIC_IMAGE_BUCKET_URL}/flags/italy-flag.png`,
      iconSource: "https://vectorflags.com/italy/it-circle-01",
      description: "Italian cuisine is a Mediterranean cuisine consisting of the ingredients, recipes, and cooking techniques developed in Italy since Roman times, and later spread around the world together with waves of Italian diaspora. It is one of the best-known and most widely appreciated gastronomies worldwide."
    },
    {
      adjective: "French",
      icon: `${process.env.NEXT_PUBLIC_IMAGE_BUCKET_URL}/flags/france-flag.png`,
      iconSource: "https://vectorflags.com/france/fr-circle-01",
      description: "French cuisine is a sophisticated and refined style of cooking known for its rich flavors, elegant presentation, and use of high-quality ingredients. It has a long and storied history that dates back centuries, with its roots tracing back to the Middle Ages when French chefs began developing a distinct style of cooking that emphasized the use of herbs, spices, and other flavorful ingredients."
    },
    {
      adjective: "British",
      icon: `${process.env.NEXT_PUBLIC_IMAGE_BUCKET_URL}/flags/united-kingdom-flag.png`,
      iconSource: "https://vectorflags.com/united-kingdom/uk-circle-01",
      description: "British cuisine consists of the cooking traditions and practices associated with the United Kingdom, including the regional cuisines of England, Scotland, Wales, and Northern Ireland. It has its roots in the cooking traditions of the indigenous Celts, but has been significantly influenced by subsequent waves of the external influence of global trade."
    },
    {
      adjective: "Scottish",
      icon: `${process.env.NEXT_PUBLIC_IMAGE_BUCKET_URL}/flags/scotland-flag.png`,
      iconSource: "https://vectorflags.com/united-kingdom/scotland/uk-sc-circle-01",
      description: "Scottish cuisine encompasses the cooking styles, traditions and recipes associated with Scotland. It has distinctive attributes and recipes of its own, but also shares much of its history with other British and wider European cuisine. Scotland's natural larder of vegetables, fruit, oats, fish and other seafood, dairy products and game is the chief factor in traditional Scottish cooking, with a high reliance on simplicity."
    },
    {
      adjective: "Welsh",
      icon: `${process.env.NEXT_PUBLIC_IMAGE_BUCKET_URL}/flags/wales-flag.png`,
      iconSource: "https://vectorflags.com/united-kingdom/wales/uk-wl-circle-01",
      description: "Welsh cuisine encompasses the cooking styles, traditions and recipes associated with Wales. While some culinary practices and dishes have been imported from other parts of Britain, uniquely Welsh cuisine grew principally from the lives of Welsh working people, largely as a result of their isolation from outside culinary influences and the need to produce food based on the limited ingredients they could produce or afford."
    },
    {
      adjective: "Irish",
      icon: `${process.env.NEXT_PUBLIC_IMAGE_BUCKET_URL}/flags/ireland-flag.png`,
      iconSource: "https://vectorflags.com/ireland/ie-circle-01",
      description: "Irish cuisine encompasses the cooking styles, traditions and recipes associated with the island of Ireland. It has developed from antiquity through centuries of social and political change and the mixing of different cultures, predominantly with those from nearby Britain and other European regions."
    },
    {
      adjective: "Spanish",
      icon: `${process.env.NEXT_PUBLIC_IMAGE_BUCKET_URL}/flags/spain-flag.png`,
      iconSource: "https://vectorflags.com/spain/es-circle-01",
      description: "Spanish cuisine, celebrated for its bold flavors, vibrant colors, and regional diversity, has gained worldwide recognition as a culinary treasure. With its rich culinary traditions and influences from various cultures, Spanish cuisine offers a tantalizing tapestry of tastes and textures."
    },
    {
      adjective: "German",
      icon: `${process.env.NEXT_PUBLIC_IMAGE_BUCKET_URL}/flags/germany-flag.png`,
      iconSource: "https://vectorflags.com/germany/de-circle-01",
      description: "German cuisine is a delightful reflection of the country's rich cultural heritage and regional diversity. With a focus on hearty flavors, comfort foods, and traditional recipes passed down through generations, German cuisine offers a satisfying and wholesome culinary experience."
    },
    {
      adjective: "Filipino",
      icon: `${process.env.NEXT_PUBLIC_IMAGE_BUCKET_URL}/flags/philippines-flag.png`,
      iconSource: "https://vectorflags.com/philippines/ph-circle-01",
      description: "Filipino cuisine is a vibrant and diverse culinary tradition that reflects the rich tapestry of Philippine history and culture. From savory stews to tropical desserts, Filipino dishes are known for their bold flavors, unique ingredients, and colorful presentation."
    },
    {
      adjective: "Japanese",
      icon: `${process.env.NEXT_PUBLIC_IMAGE_BUCKET_URL}/flags/japan-flag.png`,
      iconSource: "https://vectorflags.com/japan/jp-circle-01",
      description: "Japanese cuisine is a unique and diverse style of cooking that is known for its emphasis on fresh, seasonal ingredients, delicate flavors, and beautiful presentation. It's one of the most popular and influential cuisines in the world, with a long and storied history that dates back centuries."
    },
    {
      adjective: "Thai",
      icon: `${process.env.NEXT_PUBLIC_IMAGE_BUCKET_URL}/flags/thailand-flag.png`,
      iconSource: "https://vectorflags.com/thailand/th-circle-01",
      description: "Thai cuisine is a popular and distinctive style of cooking that is known for its bold flavors, complex spices, and use of fresh ingredients. It's one of the most popular cuisines in the world and is loved for its unique blend of sweet, sour, salty, and spicy flavors."
    },
    {
      adjective: "Vietnamese",
      icon: `${process.env.NEXT_PUBLIC_IMAGE_BUCKET_URL}/flags/vietnam-flag.png`,
      iconSource: "https://vectorflags.com/vietnam/vn-circle-01",
      description: "Vietnamese cuisine is a symphony of fresh ingredients, fragrant herbs, and bold spices. From the steaming bowls of phở to the crispy bánh mì sandwiches, Vietnamese food tantalizes taste buds and captures the essence of Southeast Asian flavors."
    },
    {
      adjective: "Indian",
      icon: `${process.env.NEXT_PUBLIC_IMAGE_BUCKET_URL}/flags/india-flag.png`,
      iconSource: "https://vectorflags.com/india/in-circle-01",
      description: "Indian cuisine is a diverse and flavorful style of cooking that is known for its use of aromatic spices, herbs, and vegetables. It's one of the oldest and most complex cuisines in the world, with a rich history that dates back thousands of years."
    },
    {
      adjective: "Chinese",
      icon: `${process.env.NEXT_PUBLIC_IMAGE_BUCKET_URL}/flags/china-flag.png`,
      iconSource: "https://vectorflags.com/china/cn-circle-01",
      description: "Chinese cuisine, with its origins in China, is a significant part of Chinese culture and has influenced many other cuisines in Asia and beyond. It is characterized by staple ingredients like rice, soy sauce, noodles, tea, and tofu, and tools such as chopsticks and the wok. The cuisine is highly diverse, with regional variations often categorized into provincial divisions."
    },
    {
      adjective: "Korean",
      icon: `${process.env.NEXT_PUBLIC_IMAGE_BUCKET_URL}/flags/south-korea-flag.png`,
      iconSource: "https://vectorflags.com/south-korea/kr-circle-01",
      description: "Korean cuisine refers to the traditional foods and preparation techniques of Korea. From the complex Korean royal court cuisine to regional specialties and modern fusion cuisine, their ingredients and preparation vary richly. Many dishes have become internationally popular."
    }
  ]);

  const insertNutritionQuery = db.insert(nutrition).values([
    {
      name: "Calories",
      description: "A unit of energy present in all foods.",
      allowedUnits: ["kcal"],
      sortIndex: 1
    },
    {
      name: "Fat",
      description: "A macronutrient primarily stored for long-term energy.",
      allowedUnits: ["g"],
      sortIndex: 2
    },
    {
      name: "Carbohydrates",
      description: "A form of energy that provides a short-term boost of energy and increases blood sugar levels.",
      allowedUnits: ["g"],
      sortIndex: 3
    },
    {
      name: "Protein",
      description: "A macronutrient that helps maintain cellular functions.",
      allowedUnits: ["g"],
      sortIndex: 4
    },
    {
      name: "Iron",
      description: "A micronutrient vital for motor function and organ development.",
      allowedUnits: ["μg", "mg"],
      sortIndex: 5
    },
    {
      name: "Sodium",
      description: "A mineral that serves",
      allowedUnits: ["mg"],
      sortIndex: 6
    },
    {
      name: "Calcium",
      description: "A mineral that plays a crucial role in preserving bone health.",
      allowedUnits: ["mg"],
      sortIndex: 7
    },
    {
      name: "Phosphorus",
      description: "A mineral that is primarily used in the normal function of the nerves and muscles.",
      allowedUnits: ["mg"],
      sortIndex: 8
    },
    {
      name: "Potassium",
      description: "An electrolyte that is used for the muscle movement, especially for the heart.",
      allowedUnits: ["mg"],
      sortIndex: 9
    },
    {
      name: "Magnesium",
      description: "A mineral used for the regulation of protein and blood sugar levels.",
      allowedUnits: ["mg"],
      sortIndex: 10
    },
    {
      name: "Zinc",
      description: "A mineral used by the body for the maintenance of the immune system.",
      allowedUnits: ["mg"],
      sortIndex: 11
    },
    {
      name: "Iodine",
      description: "A mineral used by the thyroid, which regulates the body's metabolism.",
      allowedUnits: ["μg"],
      sortIndex: 12
    },
    {
      name: "Chromium",
      description: "A mineral with several improvements to the health of the body. Although the precise benefits are not well-known, it is speculated that it can regulate insulin and protein metabolism.",
      allowedUnits: ["μg"],
      sortIndex: 13
    },
    {
      name: "Copper",
      description: "A mineral that is essential in the production of red blood cells in the body and the maintenance of the nervous and immune system.",
      allowedUnits: ["μg"],
      sortIndex: 14
    },
    {
      name: "Molybdenum",
      description: "A mineral that facilitates the filtering process of the liver.",
      allowedUnits: ["μg"],
      sortIndex: 15
    },
    {
      name: "Manganese",
      description: "A mineral required for the functioning of the nervous and enzyme systems",
      allowedUnits: ["mg"],
      sortIndex: 16
    },
    {
      name: "Selenium",
      description: "A mineral that acts as an antioxidant that protects cell health, ultimately lessening the chance of heart disease and cancer.",
      allowedUnits: ["μg"],
      sortIndex: 17
    },
    {
      name: "Vitamin A",
      description: "A nutrient that optimizes quality of vision and immune system functions.",
      allowedUnits: ["μg"],
      sortIndex: 18
    },
    {
      name: "Vitamin B1",
      description: "A water-soluble vitamin, known as thiamin, that plays a vital role in maintaining the body's metabolism and growth of cells.",
      allowedUnits: ["mg"],
      sortIndex: 19
    },
    {
      name: "Vitamin B2",
      description: "A water-soluble vitamin, known as riboflavin, that plays a crucial role in red blood cell and protein development.",
      allowedUnits: ["mg"],
      sortIndex: 20
    },
    {
      name: "Vitamin B3",
      description: "A water-soluble vitamin, known as niacin, that assists in converting food into energy.",
      allowedUnits: ["mg"],
      sortIndex: 21
    },
    {
      name: "Vitamin B5",
      description: "A water-soluble vitamin, known as pantothenic acid, that helps convert food into energy and facilitates growth of red blood cells.",
      allowedUnits: ["mg"],
      sortIndex: 22
    },
    {
      name: "Vitamin B6",
      description: "A water-soluble vitamin, known as pyridoxine, that keeps both nervous and immune systems healthy.",
      allowedUnits: ["mg"],
      sortIndex: 23
    },
    {
      name: "Vitamin B7",
      description: "A water-soluble vitamin, known as biotin, that helps break down fat, carbohydrates, and more.",
      allowedUnits: ["μg"],
      sortIndex: 24
    },
    {
      name: "Vitamin B9",
      description: "A water-soluble vitamin, known as folate, that is important for normal and red blood cell formation and function.",
      allowedUnits: ["μg"],
      sortIndex: 25
    },
    {
      name: "Vitamin B12",
      description: "A water-soluble vitamin, known as cobalamin, that is important for the production of DNA, the metabolism of cells, and the formation of red blood cells.",
      allowedUnits: ["μg"],
      sortIndex: 26
    },
    {
      name: "Vitamin C",
      description: "A vitamin, known as ascorbic acid, that the body uses as an antioxidant that prevent free molecules from causing damage to surrounding cells.",
      allowedUnits: ["mg"],
      sortIndex: 27
    },
    {
      name: "Vitamin D",
      description: "A nutrient that boosts immune system health. This nutrient is also created by the body in exposure to sunlight.",
      allowedUnits: ["μg"],
      sortIndex: 28
    },
    {
      name: "Vitamin E",
      description: "A vitamin, known as alpha-tocopherol, that helps with fighting off diseases such as Alzheimer's and liver disease.",
      allowedUnits: ["mg"],
      sortIndex: 29
    },
    {
      name: "Vitamin K",
      description: "A vitamin, known as phylloquinone, that is predimonantly present in vegetables, and they are important for wound healing.",
      allowedUnits: ["μg"],
      sortIndex: 30
    }
  ]);
  
  const insertDietsQuery = db.insert(diet).values([
    {
      name: "Paleo",
      description: "A completely natural way of eating, but seriously lacks any source of sugar. Therefore, the body will start using fat as the main energy source."
    },
    {
      name: "Vegetarian",
      description: "A diet that places an emphasis on eating plant-based foods such as fruits, vegetables, seeds, and nuts."
    },
    {
      name: "Vegan",
      description: "A subtype of the vegetarian diet that completely eliminates any animal products such as dairy and meat. This drastically decreases intake of cholesterol and fat."
    },
    {
      name: "Mediterranean",
      description: "A diet primarily of vegetables with a slightly higher emphasis on meat compared to the traditional vegetable diet."
    },
    {
      name: "Kosher",
      description: "A diet that is deemed permissible in the eyes of Judaism."
    },
    {
      name: "Halal",
      description: "A rule that dictates that foods are allowed to be eaten under the dietary laws of Islam."
    },
    {
      name: "Ketogenic",
      description: "A diet that maximizes fat but minimizes carbohydate consumption. It is usually recommended as medical treatment for various diseases."
    },
    {
      name: "South Beach",
      description: "A weight-loss diet that limits the intake of carbohydrates to minimize signs of weight gain."
    }
  ]);

  const insertDishTypesQuery = db.insert(dishType).values([
    {
      name: "Main Course",
      description: "The primary dish that is the highlight of a meal. It is usually the most presentable and appetizing dish."
    },
    {
      name: "Side",
      description: "A dish that complements the main course of a meal. They are known to add an extra variety to flavor."
    },
    {
      name: "Condiment",
      description: "A substance or sauce that intensifies the flavor of any dish that is combined with it. They are essential for maximizing the flavor of any dish."
    },
    {
      name: "Appetizer",
      description: "A food or drink is served before the main course to stimulate the appetite."
    },
    {
      name: "Breakfast",
      description: "The first meal eaten in the day. This is typically served during the morning."
    },
    {
      name: "Lunch",
      description: "A meal consumed around the middle of the day, usually around noon."
    },
    {
      name: "Dinner",
      description: "A meal eaten at around the evening time. This is considered the most formal and biggest meal of the day."
    },
    {
      name: "Snack",
      description: "A small portion of food that is usually eaten between meals. This is usually treated as an energy recharge method."
    },
    {
      name: "Drink",
      description: "A liquid intended for consumption. It is usually consumed after drinking a meal or a snack."
    },
    {
      name: "Alcohol",
      description: "An active ingredient that is considered a depressant to the central nervous system. Make sure to consume in moderation!"
    },
    {
      name: "Dessert",
      description: "A course that is eaten after a meal. Most are made to be sweet delicacies."
    },
    {
      name: "Meat",
      description: "Muscle tissue that is usually cooked to perfection to suit the best states. Vegans beware!"
    },
    {
      name: "Dairy",
      description: "Food that contains any traces of milk. "
    },
    {
      name: "Vegetable",
      description: "Edible plants that are safe for consumption. Serving options such as raw or cooked are commonly used."
    },
    {
      name: "Fruit",
      description: "Products of fruit-bearing plants that are geared towards human and animal consumption. It is usually consumed on its own."
    }
  ]);

  await Promise.all([
    insertNutritionQuery,
    insertCuisinesQuery,
    insertDietsQuery,
    insertDishTypesQuery
  ]);

  return NextResponse.json({ message: "Insert successful!" });
}
